import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` amplia o objeto `req` com o token do usuário.
  function middleware(req) {
    const isAdminDashboardPath = req.nextUrl.pathname.startsWith('/admin-dashboard');
    const userRole = req.nextauth.token?.role;

    // Se tentando acessar a rota de admin
    if (isAdminDashboardPath) {
      // Se a role no token não for 'ADMIN', redireciona para a página inicial
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    // Para outras rotas protegidas (como /dashboard), ou se for o admin acessando a rota de admin,
    // permite o acesso.
    return NextResponse.next();
  },
  {
    callbacks: {
      // O usuário precisa estar logado para qualquer rota no 'matcher'.
      authorized: ({ token }) => !!token, 
    },
  }
);

// Define quais rotas são protegidas por este middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-dashboard/:path*",
  ],
};