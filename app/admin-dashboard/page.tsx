import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Users, Package, Shapes, LineChart, DollarSign, Activity } from 'lucide-react';

// Funções para buscar os dados diretamente do banco de dados no servidor
async function getStats() {
  // Executa todas as contagens em paralelo para mais eficiência
  const [userCount, productCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count()
  ]);
  return { userCount, productCount, categoryCount };
}

// Placeholder para o futuro gráfico de usuários
function UserChartPlaceholder() {
    return (
        <Card className="col-span-1 lg:col-span-2 xl:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" />
                    Novos Usuários
                </CardTitle>
                <CardDescription>
                    Gráfico mostrando o crescimento de usuários nos últimos meses (a ser implementado).
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                <p className="text-slate-500">Dados do gráfico virão aqui.</p>
            </CardContent>
        </Card>
    )
}

export default async function AdminDashboardOverviewPage() {
  const { userCount, productCount, categoryCount } = await getStats();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Visão Geral</h1>
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Usuários cadastrados na plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <p className="text-xs text-muted-foreground">Itens disponíveis no marketplace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Shapes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
            <p className="text-xs text-muted-foreground">Categorias de produtos ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para os Gráficos */}
      <div className="grid gap-4 md:gap-8">
        <UserChartPlaceholder />
      </div>
    </>
  );
}