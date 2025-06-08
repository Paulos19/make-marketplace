'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Reservation, Product, User } from '@prisma/client';
import { ReservationRow } from './ReservationRow';

export type ReservationWithDetails = Reservation & {
  product: Product & {
    user: Pick<User, 'id' | 'name' | 'whatsappLink'>;
  };
};

export function MyReservationsClient() {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const { data } = await axios.get<ReservationWithDetails[]>('/api/my-reservations');
      setReservations(data);
    } catch (error) {
      console.error(error);
      toast.error('Falha ao carregar as suas reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelReservation = async (reservationId: string) => {
    const originalReservations = [...reservations];
    // Atualiza a UI otimisticamente
    setReservations(prev => prev.filter(r => r.id !== reservationId));

    try {
        await axios.patch(`/api/reservations/${reservationId}`, { status: 'CANCELED' });
        toast.success('Reserva cancelada com sucesso.');
        // Opcional: recarregar os dados para garantir consistência
        fetchReservations();
    } catch (error: any) {
        console.error('Failed to cancel reservation', error);
        toast.error(error?.response?.data || 'Não foi possível cancelar a reserva.');
        // Reverte em caso de erro
        setReservations(originalReservations);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
        <Table>
            <TableCaption>
                {reservations.length === 0 
                    ? "Você ainda não fez nenhuma reserva." 
                    : "Uma lista das suas reservas recentes."}
            </TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[100px]">Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reservations.map((reservation) => (
                    <ReservationRow
                        key={reservation.id} 
                        reservation={reservation}
                        onCancel={handleCancelReservation}
                    />
                ))}
            </TableBody>
        </Table>
    </div>
  );
}