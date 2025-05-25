import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` amplia sua Request com o token do usuário.
  function middleware(req) {
    const isAdminPath = req.nextUrl.pathname.startsWith('/admin-dashboard');
    const userEmail = req.nextauth.token?.email;
    const adminEmail = process.env.EMAIL_USER_MAIL;

    // Se tentando acessar a rota de admin
    if (isAdminPath) {
      // Se não for o admin, redireciona para a página inicial
      if (userEmail !== adminEmail) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    // Para outras rotas protegidas, ou se for o admin acessando a rota de admin,
    // permite o acesso.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Usuário precisa estar logado
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-dashboard/:path*", // Adiciona a nova rota do admin ao matcher
  ],
};