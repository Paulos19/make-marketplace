import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const userRole = req.nextauth.token?.role;

    // Lista de rotas que exigem permissão de ADMIN
    const adminRoutes = [
      '/admin-dashboard', 
      '/marketing-sender', 
      '/marketing-editor' // <<< ADICIONAR A NOVA ROTA AQUI
    ];

    // Verifica se a rota atual começa com algum dos caminhos de admin
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      // Se não for admin, redireciona para a página inicial
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    // Para todas as outras rotas protegidas ou se for admin, permite o acesso.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, 
    },
  }
);

// Define quais rotas são protegidas pelo middleware de autenticação
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-dashboard/:path*",
    "/marketing-sender/:path*",
    "/marketing-editor/:path*", // <<< ADICIONAR A NOVA ROTA AQUI TAMBÉM
  ],
};
