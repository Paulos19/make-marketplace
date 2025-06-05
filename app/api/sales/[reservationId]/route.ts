// app/api/sales/[reservationId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sendOrderCompletionEmail } from '@/lib/nodemailer';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    reservationId: string;
  };
}

const updateReservationSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']), 
});

// PATCH: Atualiza o status de uma reserva (CONFIRMAR ou CANCELAR)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { reservationId } = params;
    const body = await request.json();
    const validation = updateReservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Status inválido', errors: validation.error.errors }, { status: 400 });
    }

    const { status: newStatus } = validation.data;

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: {
          id: reservationId,
          product: {
            userId: session.user!.id, // O produto deve pertencer ao vendedor logado
          },
        },
        include: {
          product: true, // Para pegar productName e productId
          user: true,    // Para pegar clientEmail e clientName
        },
      });

      if (!reservation) {
        throw new Error('Reserva não encontrada ou não pertence a você.');
      }
      
      if (reservation.status === 'COMPLETED' || reservation.status === 'CANCELLED') {
        throw new Error(`Esta reserva já foi finalizada como ${reservation.status}.`);
      }

      if (newStatus === 'CANCELLED') {
        await tx.product.update({
          where: { id: reservation.productId },
          data: {
            quantity: {
              increment: reservation.quantity,
            },
          },
        });
      }
      
      const finalReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: newStatus },
      });

      // Se a entrega foi confirmada, dispara o email para o cliente
      if (newStatus === 'COMPLETED') {
        if (!reservation.user.email) {
            console.warn(`Email do cliente para a reserva ${reservationId} não encontrado. Notificação não enviada.`);
        } else {
            await sendOrderCompletionEmail({
              clientEmail: reservation.user.email,
              clientName: reservation.user.name, // name em User é string | null
              productName: reservation.product.name,
              productId: reservation.product.id,
              // <<< CORREÇÃO APLICADA AQUI >>>
              // Garante que sellerName seja string | null, nunca undefined
              sellerName: session.user?.name ?? null, 
            });
        }
      }
      
      return finalReservation;
    });

    return NextResponse.json(updatedReservation, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao atualizar reserva pelo vendedor:", error);
    return NextResponse.json({ message: error.message || 'Não foi possível atualizar a reserva' }, { status: 500 });
  }
}
