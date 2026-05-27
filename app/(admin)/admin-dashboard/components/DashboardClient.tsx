'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, Shapes, ArrowRight, ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const AnalyticsChart = dynamic(() => import('./AnalyticsChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl border border-slate-200 dark:border-slate-800" />,
});

interface DashboardClientProps {
  userCount: number;
  productCount: number;
  categoryCount: number;
  userName?: string;
}

export function DashboardClient({ userCount, productCount, categoryCount, userName }: DashboardClientProps) {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* HERO BANNER - ADMIN (RED/DARK THEME) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-red-900/50">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-red-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-slate-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start text-left">
                <Badge variant="outline" className="text-red-300 border-red-500/30 bg-red-950/50 mb-4 px-3 py-1 flex items-center gap-1.5 shadow-inner">
                    <ShieldAlert className="w-3 h-3" /> Zaca Admin
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Bem-vindo, {userName}</h1>
                <p className="text-red-100/70 max-w-xl text-lg">
                    Visão global da plataforma. Controle utilizadores, modere produtos e configure o portal.
                </p>
            </div>
            
            <div className="relative z-10 shrink-0 hidden md:flex">
                 <div className="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                    <Activity className="w-16 h-16 text-red-500/80" />
                 </div>
            </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Usuários Totais</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 dark:text-slate-50">{userCount}</div>
              <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Usuários cadastrados na plataforma</p>
                  <Link href="/admin-dashboard/users" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center hover:underline">
                      Gerenciar <ArrowRight className="ml-1 w-3 h-3" />
                  </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Produtos Ativos</CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 dark:text-slate-50">{productCount}</div>
              <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Itens disponíveis no marketplace</p>
                  <Link href="/admin-dashboard/products" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center hover:underline">
                      Catálogo <ArrowRight className="ml-1 w-3 h-3" />
                  </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Categorias Base</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shapes className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 dark:text-slate-50">{categoryCount}</div>
              <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Departamentos e nichos</p>
                  <Link href="/admin-dashboard/categories" className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center hover:underline">
                      Organizar <ArrowRight className="ml-1 w-3 h-3" />
                  </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ANALYTICS SECTION */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-500" /> Fluxo de Acessos
                </CardTitle>
                <CardDescription>
                    Métricas de visualização de páginas da plataforma nos últimos dias.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
                <AnalyticsChart />
            </CardContent>
        </Card>
    </div>
  );
}