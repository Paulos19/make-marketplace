'use client'; // Essencial: marca este como um Componente de Cliente

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Shapes } from 'lucide-react';

// Importa o componente do gráfico dinamicamente com SSR desativado
const AnalyticsChart = dynamic(() => import('./AnalyticsChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
});

// Tipagem para as props que virão do Server Component
interface DashboardClientProps {
  userCount: number;
  productCount: number;
  categoryCount: number;
}

export function DashboardClient({ userCount, productCount, categoryCount }: DashboardClientProps) {
  return (
    <div className="space-y-6">
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

      {/* Gráfico de Análise (carregado dinamicamente) */}
      <div className="grid gap-4 md:gap-8">
        <AnalyticsChart />
      </div>
    </div>
  );
}