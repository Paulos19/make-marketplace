import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ReservationStatus, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reservationUpdateSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
});

export async function PATCH(
  req: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await req.json();
    const { reservationId } = params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    if (!reservationId) {
      return NextResponse.json({ message: 'ID da reserva não encontrado' }, { status: 400 });
    }

    const validation = reservationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.flatten() }, { status: 400 });
    }
    
    const { status } = validation.data;

    const reservationToUpdate = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { product: true },
    });

    if (!reservationToUpdate) {
      return NextResponse.json({ message: 'Reserva não encontrada' }, { status: 404 });
    }

    if (reservationToUpdate.product.userId !== session.user.id) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: status,
        product: status === ReservationStatus.SOLD ? {
          update: {
            isSold: true,
          },
        } : undefined,
      },
    });
    
    revalidatePath(`/dashboard/sales`);
    revalidatePath(`/products/${reservationToUpdate.productId}`);

    return NextResponse.json(updatedReservation);

  } catch (error) {
    console.error(`[RESERVATION_PATCH]`, error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ message: 'Erro Interno do Servidor', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    if (!reservationId) {
      return NextResponse.json({ message: 'ID da reserva não encontrado' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { 
        userId: true, 
        productId: true
      },
    });

    if (!reservation) {
      return NextResponse.json({ message: 'Reserva não encontrada' }, { status: 404 });
    }

    if (reservation.userId !== session.user.id) {
      return NextResponse.json({ message: 'Ação não permitida. Você não é o dono desta reserva.' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.reservation.delete({
        where: { id: reservationId },
      }),
      prisma.product.update({
        where: { id: reservation.productId },
        data: { isReserved: false },
      }),
    ]);
    
    revalidatePath(`/my-reservations`);
    revalidatePath(`/products/${reservation.productId}`);

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[RESERVATION_DELETE]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ message: 'Erro Interno do Servidor', error: errorMessage }, { status: 500 });
  }
}
