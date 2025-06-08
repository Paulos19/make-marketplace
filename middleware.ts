import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` amplia o objeto `req` com o token do usuário.
  function middleware(req) {
    const isAdminDashboardPath = req.nextUrl.pathname.startsWith('/admin-dashboard');
    const isMarketingSenderPath = req.nextUrl.pathname.startsWith('/marketing-sender'); // <<< ADICIONADO
    const userRole = req.nextauth.token?.role;

    // Se tentando acessar qualquer rota de admin
    if (isAdminDashboardPath || isMarketingSenderPath) { // <<< CONDIÇÃO ATUALIZADA
      // Se a role no token não for 'ADMIN', redireciona para a página inicial
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    // Para outras rotas protegidas, permite o acesso.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, 
    },
  }
);

// Define quais rotas são protegidas por este middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-dashboard/:path*",
    "/marketing-sender/:path*", // <<< ROTA ADICIONADA
  ],
};
