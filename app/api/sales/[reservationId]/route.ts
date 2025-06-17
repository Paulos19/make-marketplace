// app/api/sales/[reservationId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sendOrderCompletionEmail } from '@/lib/nodemailer';
import { UserRole, ReservationStatus } from '@prisma/client';

interface RouteParams {
  params: {
    reservationId: string;
  };
}

// Schema de validação atualizado para aceitar os valores enviados pelo frontend
const updateReservationSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']), // Aceita 'COMPLETED' e 'CANCELLED' (com 2 'L')
});

// PATCH: Atualiza o status de uma reserva
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

    // <<< INÍCIO DA CORREÇÃO: Mapear o status do frontend para o status do banco de dados >>>
    const { status: frontendStatus } = validation.data;
    let newDbStatus: ReservationStatus;

    if (frontendStatus === 'COMPLETED') {
      newDbStatus = ReservationStatus.SOLD;
    } else if (frontendStatus === 'CANCELLED') {
      newDbStatus = ReservationStatus.CANCELED;
    } else {
      // Este caso é teoricamente inalcançável devido à validação do Zod, mas é uma boa prática
      return NextResponse.json({ message: 'Status desconhecido fornecido.' }, { status: 400 });
    }
    // <<< FIM DA CORREÇÃO >>>

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: {
          id: reservationId,
          product: {
            userId: session.user!.id,
          },
        },
        include: {
          product: true,
          user: true,
        },
      });

      if (!reservation) {
        throw new Error('Reserva não encontrada ou não pertence a você.');
      }
      
      if (reservation.status === ReservationStatus.SOLD || reservation.status === ReservationStatus.CANCELED) {
        throw new Error(`Esta reserva já foi finalizada como ${reservation.status}.`);
      }

      if (newDbStatus === ReservationStatus.CANCELED) {
        // Devolve a quantidade ao estoque se a venda for cancelada
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
        data: { status: newDbStatus }, // Usa a variável com o valor correto do Enum
      });

      if (newDbStatus === ReservationStatus.SOLD) {
        if (!reservation.user.email) {
            console.warn(`Email do cliente para a reserva ${reservationId} não encontrado. Notificação não enviada.`);
        } else {
            await sendOrderCompletionEmail({
              clientEmail: reservation.user.email,
              clientName: reservation.user.name,
              productName: reservation.product.name,
              productId: reservation.product.id,
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
