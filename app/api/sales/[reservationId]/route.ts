import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole, ReservationStatus } from '@prisma/client';
import crypto from 'crypto';
import { sendReviewRequestEmail } from '@/lib/resend';


// Handler PATCH para atualizar o status de uma reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    if (!reservationId) {
      return NextResponse.json({ error: 'ID da reserva não fornecido.' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const newStatus: ReservationStatus = body.status;
    if (!newStatus || !Object.values(ReservationStatus).includes(newStatus)) {
      return NextResponse.json({ error: 'Status inválido fornecido.' }, { status: 400 });
    }

    // Utiliza uma transação para garantir a consistência dos dados
    const updatedReservation = await prisma.$transaction(async (tx) => {
      // 1. Encontra a reserva e o produto associado
      const reservation = await tx.reservation.findFirst({
        where: { id: reservationId, product: { userId: session.user?.id } },
        include: { product: true },
      });

      if (!reservation) {
        throw new Error('Reserva não encontrada ou não pertence a este vendedor.');
      }

      const product = reservation.product;
      const oldStatus = reservation.status;
      let reviewToken: string | null = null;
      
      const productUpdateData: { quantity?: number; isSold?: boolean; isReserved?: boolean; } = {};

      // 2. Lógica de gestão de stock
      if (newStatus === ReservationStatus.SOLD && oldStatus !== ReservationStatus.SOLD) {
        const newQuantity = product.quantity - reservation.quantity;
        productUpdateData.quantity = newQuantity;
        productUpdateData.isSold = newQuantity <= 0;
        productUpdateData.isReserved = false;
        reviewToken = crypto.randomBytes(32).toString('hex');
      } 
      else if (newStatus !== ReservationStatus.SOLD && oldStatus === ReservationStatus.SOLD) {
        productUpdateData.quantity = product.quantity + reservation.quantity;
        productUpdateData.isSold = false;
        productUpdateData.isReserved = newStatus === ReservationStatus.PENDING;
      }
      else {
        productUpdateData.isReserved = newStatus === ReservationStatus.PENDING;
      }
      
      // 3. Atualiza o produto e a reserva
      await tx.product.update({
        where: { id: product.id },
        data: productUpdateData,
      });

      const finalUpdatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: newStatus,
          ...(reviewToken && { reviewToken }),
        },
        include: { user: true, product: true },
      });
      
      // 4. Envia e-mail de avaliação se a venda for concluída
      if (newStatus === ReservationStatus.SOLD && reviewToken && finalUpdatedReservation.user.email) {
        const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/review/${reviewToken}`;
        await sendReviewRequestEmail({
          to: finalUpdatedReservation.user.email,
          buyerName: finalUpdatedReservation.user.name || 'Cliente Zacaplace',
          productName: finalUpdatedReservation.product.name,
          reviewLink: reviewLink,
        });
      }

      return finalUpdatedReservation;
    });

    return NextResponse.json(updatedReservation);

  } catch (error) {
    console.error('[RESERVATIONS_PATCH_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a reserva.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


// Handler DELETE para arquivar a reserva
export async function DELETE(
    request: NextRequest,
    { params }: { params: { reservationId: string } }
) {
    try {
        const { reservationId } = params;
        if (!reservationId) {
            return NextResponse.json({ error: 'ID da reserva não fornecido.' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== UserRole.SELLER) {
            return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
        }

        const reservationToArchive = await prisma.reservation.findFirst({
            where: {
                id: reservationId,
                product: { userId: session.user.id },
            },
        });

        if (!reservationToArchive) {
            return NextResponse.json({ error: 'Reserva não encontrada ou não pertence a você.' }, { status: 404 });
        }

        // Não exclui, apenas marca como arquivada
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { isArchived: true },
        });

        return new NextResponse(null, { status: 204 }); // Sucesso

    } catch (error) {
        console.error('[RESERVATION_ARCHIVE_ERROR]', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao arquivar a reserva.' }, { status: 500 });
    }
}
