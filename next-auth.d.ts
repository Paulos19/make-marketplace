import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client"; // Certifique-se que o Prisma Client está gerado e UserRole está exportado

declare module "next-auth" {
  /**
   * Retornado pelas props `useSession`, `getSession` e `getServerSession`.
   */
  interface Session extends DefaultSession {
    user?: {
      id: string; // ID é geralmente uma string e obrigatório
      role?: UserRole | string | null; // Papel do usuário, pode ser o enum ou string
      whatsappLink?: string | null;
    } & DefaultSession["user"]; // Mantém as propriedades padrão como name, email, image
  }

  /** O objeto User como retornado pelos callbacks do adapter ou profile. */
  interface User extends DefaultUser {
    id: string; // Adicionando id aqui também, pois é fundamental
    role?: UserRole | string | null;
    whatsappLink?: string | null;
    // Se você adicionou passwordHash ao objeto User retornado por authorize, declare aqui também
    // passwordHash?: string | null; // Geralmente não é necessário na sessão
  }
}

declare module "next-auth/jwt" {
  /** Retornado pelo callback `jwt` e props `getToken`. */
  interface JWT extends DefaultJWT {
    id?: string; // ID do usuário
    role?: UserRole | string | null; // Papel do usuário
    whatsappLink?: string | null;
  }
}