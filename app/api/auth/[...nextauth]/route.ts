// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

// Interface para estender o usuário da sessão e do token JWT
interface CustomUser extends NextAuthUser {
  id: string;
  role?: UserRole | string; // UserRole é o enum do Prisma
  whatsappLink?: string | null;
  storeName?: string | null;
  // Outros campos de vendedor que você quer na sessão/token
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Credenciais inválidas.");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Credenciais inválidas.");
        }

        // Retorna o objeto usuário para ser usado nos callbacks
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Role vem do banco
          whatsappLink: user.whatsappLink, // Campo direto do User
          storeName: user.storeName,     // Campo direto do User
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      const userEmail = user.email;
      if (!userEmail) return false; // Impede o login se não houver email

      const isAdminEmail = userEmail === process.env.EMAIL_ADMIN_USER;

      try {
        let dbUser = await prisma.user.findUnique({ 
          where: { email: userEmail }
        });

        if (isAdminEmail) {
          // Se é o email do admin
          if (dbUser) {
            // Se o usuário admin já existe e sua role não é ADMIN, atualiza
            if (dbUser.role !== UserRole.ADMIN) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { role: UserRole.ADMIN },
              });
            }
          } else if (account?.provider !== "credentials") {
            // Se é o email do admin se registrando pela primeira vez via OAuth/Email
            // O adapter já criou o usuário (provavelmente com role USER).
            // Precisamos encontrar esse usuário recém-criado e atualizar sua role.
            // Esta parte é um pouco mais complexa devido à ordem de execução.
            // A atualização da role para ADMIN é mais garantida no callback jwt.
            // Mas, para o registro inicial, podemos tentar aqui.
            const newUserByAdapter = await prisma.user.findUnique({ where: {email: userEmail }});
            if (newUserByAdapter && newUserByAdapter.role !== UserRole.ADMIN) {
                 dbUser = await prisma.user.update({
                    where: { id: newUserByAdapter.id },
                    data: { role: UserRole.ADMIN }
                 });
            }
          }
          // Atualiza o objeto 'user' que será passado para o callback 'jwt'
          if (dbUser) user.role = dbUser.role;

        } else if (dbUser) {
          // Para usuários não-admin existentes, a role deles (USER ou SELLER) é mantida.
           user.role = dbUser.role; // Garante que a role do DB seja usada no JWT
        }
        // Se for um novo usuário não-admin via OAuth/Email, o adapter o cria com role USER (default).

      } catch (error) {
        console.error("Erro no callback signIn ao verificar/atualizar role:", error);
        return false; // Bloqueia o login em caso de erro crítico
      }
      return true; // Permite o login
    },

    async jwt({ token, user, trigger, session: sessionUpdateData }) {
      if (user) { // Na primeira vez (login/registro), 'user' (do provider/authorize) está disponível
        token.id = user.id;
        token.role = user.role; // A role já deve ter sido definida/corrigida no signIn
        token.name = user.name;
        token.picture = user.image;

        // Busca os dados mais recentes do banco para garantir consistência
        // especialmente para campos como whatsappLink e storeName que podem não vir do 'user' inicial
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (dbUser) {
          token.role = dbUser.role; // Garante que a role do DB é a autoridade final
          if (dbUser.role === UserRole.SELLER || dbUser.role === UserRole.ADMIN) {
            token.whatsappLink = dbUser.whatsappLink;
            token.storeName = dbUser.storeName;
          } else {
            delete token.whatsappLink;
            delete token.storeName;
          }
        }
      }
      
      // Atualiza o token se a sessão for alterada (ex: via useSession().update())
      if (trigger === "update" && sessionUpdateData?.user) {
        const userDataFromUpdate = sessionUpdateData.user as Partial<CustomUser>;
        if (userDataFromUpdate.name !== undefined) token.name = userDataFromUpdate.name;
        if (userDataFromUpdate.image !== undefined) token.picture = userDataFromUpdate.image;
        if (userDataFromUpdate.whatsappLink !== undefined) token.whatsappLink = userDataFromUpdate.whatsappLink;
        if (userDataFromUpdate.storeName !== undefined) token.storeName = userDataFromUpdate.storeName;
        // A role não deve ser atualizada diretamente pela sessão do cliente por segurança
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.name = token.name;
        session.user.image = token.picture;
        
        const extendedUser = session.user as CustomUser;
        if (token.whatsappLink !== undefined) extendedUser.whatsappLink = token.whatsappLink as string | null;
        if (token.storeName !== undefined) extendedUser.storeName = token.storeName as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
