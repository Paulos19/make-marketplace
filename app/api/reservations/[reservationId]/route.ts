import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

interface RouteParams {
  params: {
    reservationId: string;
  };
}

// Handler para excluir uma reserva
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { reservationId } = params;

    if (!reservationId) {
      return NextResponse.json({ message: 'Reservation ID is required' }, { status: 400 });
    }

    // Transação para garantir atomicidade
    const deletedReservation = await prisma.$transaction(async (tx) => {
      // Encontrar a reserva para verificar o proprietário e obter productId e quantity
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { userId: true, productId: true, quantity: true, status: true },
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Verificar se o usuário logado é o proprietário da reserva
      if (reservation.userId !== session.user?.id) {
        throw new Error('Forbidden: You can only delete your own reservations');
      }

      // Excluir a reserva
      await tx.reservation.delete({
        where: { id: reservationId },
      });

      // Incrementar a quantidade do produto de volta
      // Só devolver ao estoque se a reserva não estava, por exemplo, 'CANCELLED_BY_SELLER' ou algo que já ajustou o estoque.
      // Para o fluxo atual, PENDING e CONFIRMED (se excluído pelo usuário) devem devolver.
      // Se o status for 'COMPLETED' ou 'SHIPPED', a exclusão pode ter regras diferentes.
      // Por simplicidade, vamos assumir que a exclusão de PENDING/CONFIRMED devolve ao estoque.
      if (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') {
         await tx.product.update({
            where: { id: reservation.productId },
            data: {
            quantity: {
                increment: reservation.quantity,
            },
            },
        });
      }
      
      return reservation; // Retorna a reserva deletada para possível log ou referência
    });

    return NextResponse.json({ message: 'Reservation deleted successfully', reservation: deletedReservation }, { status: 200 });

  } catch (error) {
    console.error("Delete reservation error:", error);
    if (error instanceof Error) {
      if (error.message === 'Reservation not found') {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ message: 'Could not delete reservation' }, { status: 500 });
  }
}

// Handler para atualizar o status de uma reserva (ex: confirmar pedido)
const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']), // Changed CANCELLED_BY_USER to CANCELLED
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { reservationId } = params;
    if (!reservationId) {
      return NextResponse.json({ message: 'Reservation ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateReservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { status: newStatus } = validation.data;

    // Encontrar a reserva para verificar o proprietário
    const reservationToCheck = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { userId: true, status: true, productId: true, quantity: true },
    });

    if (!reservationToCheck) {
      return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });
    }

    if (reservationToCheck.userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You can only update your own reservations' }, { status: 403 });
    }

    // Lógica de transição de status (exemplo simples)
    // Se estiver cancelando uma reserva PENDING ou CONFIRMED, devolver ao estoque.
    if (newStatus === 'CANCELLED' && (reservationToCheck.status === 'PENDING' || reservationToCheck.status === 'CONFIRMED')) { // Changed CANCELLED_BY_USER to CANCELLED
        await prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: reservationToCheck.productId },
                data: {
                    quantity: {
                        increment: reservationToCheck.quantity,
                    },
                },
            });
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: newStatus },
            });
        });
    } else {
        // Para outras atualizações de status (ex: PENDING -> CONFIRMED)
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: newStatus },
        });
    }

    const updatedReservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { product: { select: { id: true, name: true, imageUrls: true, price: true } } }
    });

    return NextResponse.json(updatedReservation, { status: 200 });

  } catch (error) {
    console.error("Update reservation error:", error);
    if (error instanceof Error) {
      if (error.message === 'Reservation not found') {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
       if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ message: 'Could not update reservation' }, { status: 500 });
  }
}