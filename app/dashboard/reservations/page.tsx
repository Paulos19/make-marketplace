"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Componentes Shadcn/ui
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Ícones Lucide
import {
  AlertTriangle, ShoppingBag, PackageCheck, Trash2, ListOrdered, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

// Definição do tipo Reservation com detalhes do Produto
interface ReservationWithProduct {
  id: string;
  quantity: number;
  status: string; // ex: PENDING, CONFIRMED, CANCELLED
  createdAt: string;
  product: {
    id: string;
    name: string;
    imageUrls: string[];
    price: number;
    // Adicionar mais campos do produto se necessário
  };
  // Adicionar userId se necessário para alguma lógica específica no frontend
}

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => session?.user?.id, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userId) {
      const fetchReservations = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/reservations?userId=${userId}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao buscar suas reservas' }));
            throw new Error(errorData.message || 'Falha ao buscar suas reservas');
          }
          const data = await response.json();
          setReservations(Array.isArray(data) ? data : []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
          console.error("Erro ao buscar reservas:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReservations();
    } else if (status === 'authenticated' && !userId) {
      setIsLoading(false);
      setError("ID do usuário não encontrado na sessão para buscar reservas.");
    }
  }, [status, userId, router]);

  const handleConfirmOrder = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONFIRMED' }), // Novo status
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao confirmar reserva.' }));
        throw new Error(errorData.message || 'Não foi possível confirmar a reserva.');
      }

      const updatedReservation = await response.json();
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, ...updatedReservation } : r));
      toast('Reserva confirmada com sucesso!');
      // Opcional: Adicionar um toast de sucesso

    } catch (err) {
      console.error('Erro ao confirmar reserva:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao confirmar reserva');
      toast(`Erro ao confirmar reserva: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteReservation = async (reservationId: string, productName: string, reservedQuantity: number) => {
    // A função handleDeleteReservation que você já tem deve funcionar com o novo endpoint DELETE
    // Certifique-se que ela está chamando DELETE /api/reservations/[reservationId]
    // A implementação anterior já estava correta para chamar o endpoint DELETE.
    if (!confirm(`Tem certeza que deseja excluir a reserva de ${reservedQuantity}x ${productName}? Esta ação não pode ser desfeita e a quantidade será devolvida ao estoque.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao excluir reserva.' }));
        throw new Error(errorData.message || 'Não foi possível excluir a reserva.');
      }
      setReservations(prev => prev.filter(res => res.id !== reservationId));
      toast(`Reserva de ${productName} excluída com sucesso!`);
    } catch (err) {
      console.error('Erro ao excluir reserva:', err);
      // Mantenha o setError para exibir o erro na UI se desejar
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir reserva'); 
      toast(`Erro ao excluir reserva: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <ListOrdered className="w-12 h-12 animate-pulse text-sky-500 mb-4" />
        <p className="text-xl text-gray-700 dark:text-gray-300">Carregando suas reservas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()} className="mb-6 sm:mb-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-sky-700 dark:text-sky-500 flex-grow">Minhas Reservas</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="dark:bg-gray-800/50 animate-pulse">
                <CardHeader className="flex flex-row items-center space-x-4 p-4">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-4 w-1/4 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-2/3 rounded" />
                </CardContent>
                <CardFooter className="p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
                  <Skeleton className="h-9 w-28 rounded-md" />
                  <Skeleton className="h-9 w-28 rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="dark:bg-gray-800/50">
            <CardContent className="p-6 text-center text-red-500 dark:text-red-400">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-3" />
              <p className="font-semibold">Erro ao carregar suas reservas.</p>
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">Tentar Novamente</Button>
            </CardContent>
          </Card>
        ) : reservations.length === 0 ? (
          <Card className="dark:bg-gray-800/50">
            <CardContent className="p-10 text-center text-gray-500 dark:text-gray-400">
              <ListOrdered className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma reserva encontrada.</h3>
              <p className="mb-4">Você ainda não fez nenhuma reserva. Que tal explorar nossos produtos?</p>
              <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
                <Link href="/">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Ver Produtos
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800/80 border dark:border-gray-700/50">
                <CardHeader className="p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 border-b dark:border-gray-700/50">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                    <Image
                      src={reservation.product.imageUrls && reservation.product.imageUrls.length > 0 ? reservation.product.imageUrls[0] : '/placeholder-product.jpg'}
                      alt={reservation.product.name}
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 640px) 96px, 112px"
                    />
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="text-lg sm:text-xl font-semibold truncate hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                      <Link href={`/products/${reservation.product.id}`} target="_blank" title={`Ver ${reservation.product.name} na loja`}>{reservation.product.name}</Link>
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade: {reservation.quantity}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status: <Badge variant={reservation.status === 'PENDING' ? 'secondary' : reservation.status === 'CONFIRMED' ? 'default' : 'destructive'} className={`capitalize text-xs px-2 py-0.5 ${reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300' : reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300'}`}>{reservation.status.toLowerCase().replace('_', ' ')}</Badge></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reservado em: {new Date(reservation.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-500 mt-1">Total: R$ {(reservation.product.price * reservation.quantity).toFixed(2)}</p>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {reservation.status === 'PENDING' && (
                    <Button variant="outline" size="sm" onClick={() => handleConfirmOrder(reservation.id)} className="w-full sm:w-auto border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-600 dark:text-green-500 dark:hover:bg-green-700/20 dark:hover:text-green-400">
                      <PackageCheck className="mr-2 h-4 w-4" /> Confirmar Pedido
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteReservation(reservation.id, reservation.product.name, reservation.quantity)} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir Reserva
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}