import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/DashboardClient"; // Importe o novo componente

// Função para buscar os dados no servidor
async function getStats() {
  const [userCount, productCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count()
  ]);
  return { userCount, productCount, categoryCount };
}

// A página continua sendo um Server Component Assíncrono
export default async function AdminDashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  // Proteção da rota
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/');
  }

  // Busca os dados no servidor
  const { userCount, productCount, categoryCount } = await getStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe as métricas principais do seu marketplace.</p>
      </div>
      
      {/* Renderiza o componente cliente, passando os dados como props */}
      <DashboardClient 
        userCount={userCount}
        productCount={productCount}
        categoryCount={categoryCount}
      />
    </div>
  );
}