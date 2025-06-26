'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Inbox, Trash2, AlertTriangle, User, Calendar, MessageSquare } from 'lucide-react';
import { ReservationStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ProductInfo = {
  id: string;
  name: string;
  images: string[];
};
type UserInfo = {
  name: string | null;
  whatsappLink: string | null;
};
type ReservationWithDetails = {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  product: ProductInfo;
  user: UserInfo;
};

export default function SalesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});
  const [reservationToDelete, setReservationToDelete] = useState<ReservationWithDetails | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth/signin');
    if (authStatus === 'authenticated') {
      fetch('/api/sales')
        .then(res => res.json())
        .then(data => setReservations(Array.isArray(data) ? data : []))
        .catch(() => toast.error('Falha ao carregar o histórico de vendas.'))
        .finally(() => setIsLoading(false));
    }
  }, [authStatus, router]);

  const setActionLoading = (id: string, state: boolean) => {
    setActionStates(prev => ({ ...prev, [id]: state }));
  }

  const handleUpdateStatus = async (reservationId: string, newStatus: ReservationStatus) => {
    setActionLoading(reservationId, true);
    try {
      const response = await fetch(`/api/sales/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedReservation = await response.json();
      if (!response.ok) throw new Error(updatedReservation.error || 'Falha ao atualizar o status.');
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: updatedReservation.status } : r));
      toast.success(`Reserva atualizada para "${newStatus.toString()}"!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setActionLoading(reservationId, false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    setActionLoading(reservationToDelete.id, true);
    try {
        const response = await fetch(`/api/sales/${reservationToDelete.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error((await response.json()).error || "Falha ao excluir.");
        
        toast.success("Registo de reserva excluído com sucesso.");
        setReservations(prev => prev.filter(r => r.id !== reservationToDelete.id));
        setReservationToDelete(null);
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
        setActionLoading(reservationToDelete.id, false);
    }
  };

  const getStatusVariant = (status: ReservationStatus): "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case 'SOLD': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELED': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading || authStatus === 'loading') {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div>
        <CardHeader className="px-0">
            <CardTitle className="text-2xl sm:text-3xl">Histórico de Vendas e Reservas</CardTitle>
            <CardDescription>Gerencie o status de todas as reservas dos seus produtos.</CardDescription>
        </CardHeader>
    
        {reservations.length === 0 ? (
        <Card className="text-center py-16 text-muted-foreground border-dashed">
            <Inbox className="mx-auto h-16 w-16" />
            <h3 className="mt-4 text-xl font-semibold">Nenhuma reserva encontrada</h3>
            <p className="mt-1 text-sm">Quando um cliente reservar um produto, ele aparecerá aqui.</p>
        </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((reservation) => (
            <Card key={reservation.id} className="flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-start gap-4 p-4">
                    <Link href={`/products/${reservation.product.id}`} target="_blank" className="flex-shrink-0">
                        <Image
                        src={(reservation.product.images && reservation.product.images.length > 0) ? reservation.product.images[0] : '/img-placeholder.png'}
                        alt={reservation.product.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover border aspect-square"
                        />
                    </Link>
                    <div className="flex-grow">
                        <Link href={`/products/${reservation.product.id}`} target="_blank" className="hover:underline">
                            <CardTitle className="text-base font-semibold leading-tight">{reservation.product.name}</CardTitle>
                        </Link>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            <p className="flex items-center gap-2"><User className="h-4 w-4"/> {reservation.user.name || 'Cliente'}</p>
                            <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {new Date(reservation.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <Select
                        value={reservation.status}
                        onValueChange={(newStatus: ReservationStatus) => handleUpdateStatus(reservation.id, newStatus)}
                        disabled={actionStates[reservation.id]}
                    >
                        <SelectTrigger>
                        <SelectValue>
                            {actionStates[reservation.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Badge variant={getStatusVariant(reservation.status)}>{reservation.status}</Badge>}
                        </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value={ReservationStatus.PENDING}>Pendente</SelectItem>
                        <SelectItem value={ReservationStatus.SOLD}>Vendido</SelectItem>
                        <SelectItem value={ReservationStatus.CANCELED}>Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between">
                    {reservation.user.whatsappLink ? (
                        <Button asChild variant="outline" size="sm">
                            <a href={reservation.user.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageSquare className="h-4 w-4 mr-2"/>Contatar</a>
                        </Button>
                    ) : <div />}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setReservationToDelete(reservation)}>
                       <Trash2 className="h-4 w-4"/>
                    </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
        )}

        <Dialog open={!!reservationToDelete} onOpenChange={(isOpen) => !isOpen && setReservationToDelete(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja excluir este registo de reserva? Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" onClick={() => setReservationToDelete(null)} disabled={actionStates[reservationToDelete?.id || '']}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionStates[reservationToDelete?.id || '']}>
                        {actionStates[reservationToDelete?.id || ''] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Confirmar Exclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
