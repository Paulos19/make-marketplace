// app/dashboard/sales/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShoppingBag, ArrowLeft, PackageCheck, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Sale {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    imageUrls: string[];
  };
  user: { // Comprador
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function MySalesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated') {
      const fetchSales = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/sales');
          if (!response.ok) throw new Error('Falha ao buscar suas vendas');
          const data = await response.json();
          setSales(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSales();
    }
  }, [status, router]);

  const handleUpdateStatus = async (reservationId: string, newStatus: 'COMPLETED' | 'CANCELLED') => {
    setUpdatingId(reservationId);
    try {
      const response = await fetch(`/api/sales/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar o status da venda.');
      }
      
      const updatedSale = await response.json();
      setSales(prev => prev.map(s => s.id === reservationId ? { ...s, status: updatedSale.status } : s));
      toast.success(`Venda ${newStatus === 'COMPLETED' ? 'confirmada' : 'cancelada'} com sucesso!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar venda.');
    } finally {
      setUpdatingId(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300">Pendente</Badge>;
      case 'CONFIRMED': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300">Confirmado</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300">Entregue</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-6 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-sky-700 dark:text-sky-500 flex-grow">Minhas Vendas</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <Card className="text-center p-6 bg-red-50 dark:bg-red-900/20"><AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />{error}</Card>
        ) : sales.length === 0 ? (
          <Card className="text-center p-10"><ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h3 className="text-xl font-semibold">Nenhuma venda encontrada</h3><p className="text-gray-500">Quando um cliente reservar um de seus produtos, a reserva aparecerá aqui.</p></Card>
        ) : (
          <div className="space-y-6">
            {sales.map((sale) => (
              <Card key={sale.id} className="overflow-hidden shadow-lg dark:bg-gray-800/80 border dark:border-gray-700/50">
                <CardHeader className="p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 border-b dark:border-gray-700/50">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image src={sale.product.imageUrls[0] || '/placeholder-product.jpg'} alt={sale.product.name} fill className="object-cover rounded-md" />
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="text-lg font-semibold hover:text-sky-600 dark:hover:text-sky-400"><Link href={`/products/${sale.product.id}`} target="_blank">{sale.product.name}</Link></CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Comprador: <strong>{sale.user.name || 'N/A'}</strong> ({sale.user.email})</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade: <strong>{sale.quantity}</strong></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reservado em: {new Date(sale.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="self-start sm:self-center">
                    {getStatusBadge(sale.status)}
                  </div>
                </CardHeader>
                <CardFooter className="p-4 flex flex-col sm:flex-row justify-end items-center gap-2">
                  {updatingId === sale.id && <Loader2 className="h-5 w-5 animate-spin" />}
                  {(sale.status === 'PENDING' || sale.status === 'CONFIRMED') && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(sale.id, 'CANCELLED')} disabled={!!updatingId} className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <XCircle className="mr-2 h-4 w-4" /> Cancelar Pedido
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(sale.id, 'COMPLETED')} disabled={!!updatingId} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                        <PackageCheck className="mr-2 h-4 w-4" /> Confirmar Entrega
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}