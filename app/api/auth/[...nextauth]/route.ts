import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email"; // Importação adicionada
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client"; // Importar UserRole do Prisma

// Defina uma interface que estenda o User do NextAuth para incluir o 'role' e 'id'
interface UserWithRole extends NextAuthUser {
  id: string; // id é essencial
  role?: UserRole | string; // Papel do usuário
  whatsappLink?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER, // ex: smtp://user:pass@smtp.example.com:587
      from: process.env.EMAIL_FROM,     // ex: NextAuth <noreply@example.com>
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !('passwordHash' in user)) {
          // Considerar não revelar se o usuário existe ou não por segurança
          throw new Error("Credenciais inválidas.");
        }

        const isValidPassword = bcrypt.compare(
          credentials.password,
          user.passwordHash as string
        );

        if (!isValidPassword) {
          throw new Error("Credenciais inválidas.");
        }

        // Retornar o objeto usuário conforme definido na interface User do next-auth.d.ts
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Incluir o papel
          whatsappLink: user.whatsappLink, // Incluir o link do WhatsApp
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verifica se o email do usuário é o email do admin definido no .env
      const isAdminEmail = user.email === process.env.EMAIL_USER_MAIL;
      let targetRole: UserRole = isAdminEmail ? UserRole.ADMIN : UserRole.USER;

      try {
        const dbUser = await prisma.user.findUnique({ 
          where: { email: user.email! }
        });

        // Se o usuário existe e seu papel precisa ser atualizado, ou se é um novo usuário (o adapter cria o usuário)
        if (dbUser && dbUser.role !== targetRole) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { role: targetRole },
          });
        } else if (!dbUser && account?.provider !== 'credentials') {
          // Para provedores OAuth/Email, o adapter cria o usuário.
          // Se o adapter já criou o usuário, precisamos garantir que o papel seja definido corretamente.
          // Isso pode ser um pouco redundante se o adapter já lida com isso, mas garante.
          // Para 'credentials', o usuário já deve existir.
          // A lógica de criação de usuário com papel correto é mais robusta no adapter createUser.
          // No entanto, para simplicidade, vamos tentar atualizar aqui após a criação pelo adapter.
          // Uma abordagem mais limpa seria customizar o adapter `createUser`.
          
          // Tentativa de definir o papel após a criação pelo adapter (para OAuth/Email)
          // Pode ser necessário um pequeno delay ou verificar se o usuário foi criado
          // Esta parte é mais complexa de sincronizar perfeitamente sem customizar o adapter.
          // Por ora, a lógica principal é garantir que o papel seja atualizado se já existe.
        }

      } catch (error) {
        console.error("Erro ao verificar/atualizar papel do usuário no signIn:", error);
        // return false; // Descomente para bloquear o login em caso de erro
      }
      return true; // Permite o login
    },

    async jwt({ token, user, trigger, session: sessionUpdateData }) { 
      if (user) { // Este 'user' é o objeto do provider ou do authorize
        token.id = (user as UserWithRole).id;
        // Determina a role com base no email do admin, similar ao signIn, 
        // para garantir que o token inicial tenha a role correta, especialmente se for o primeiro login.
        const isAdminEmail = user.email === process.env.EMAIL_USER_MAIL;
        const determinedRole = isAdminEmail ? UserRole.ADMIN : UserRole.USER;
        token.role = determinedRole;
        token.whatsappLink = (user as UserWithRole).whatsappLink;
    
        // Se for um usuário existente, podemos pegar outros dados do DB se necessário,
        // mas a 'role' principal já foi determinada acima.
        // Se você quiser garantir que a role no token SEMPRE reflita o DB mais recente após o signIn/signUp:
        if (trigger === "signIn" || trigger === "signUp") {
            const dbUser = await prisma.user.findUnique({
                where: { id: (user as UserWithRole).id },
            });
            if (dbUser) {
                token.role = dbUser.role; // Sobrescreve com a role do DB se encontrada
                token.whatsappLink = dbUser.whatsappLink; // E outros campos do DB
            }
        }
      } else if (trigger === "update" && sessionUpdateData) {
        token.whatsappLink = (sessionUpdateData as { user?: { whatsappLink?: string } }).user?.whatsappLink ?? token.whatsappLink;
      }
      return token;
    },

    async session({ session, token }) {
      // Adiciona as propriedades customizadas do token para o objeto session.user
      if (session.user) {
        (session.user as UserWithRole).id = token.id as string;
        (session.user as UserWithRole).role = token.role as UserRole | string; // Use UserRole se possível
        (session.user as UserWithRole).whatsappLink = token.whatsappLink as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
    // newUser: null, // Redireciona para a página inicial após o primeiro login
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };