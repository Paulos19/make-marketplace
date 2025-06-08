import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

/**
 * PATCH /api/reservations/[reservationId]
 * Permite que um cliente (comprador) CANCELE uma reserva que ele mesmo fez.
 * Apenas funciona se a reserva estiver com o status 'PENDING'.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { status } = body;

    // 1. Validação de segurança e de dados
    if (!session?.user?.id) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    if (!params.reservationId) {
      return new NextResponse('ID da reserva não encontrado', { status: 400 });
    }

    // Esta rota só permite a ação de cancelar
    if (status !== ReservationStatus.CANCELED) {
      return new NextResponse('Ação não permitida', { status: 403 });
    }

    // 2. Verificar se a reserva existe e pertence ao utilizador logado
    const reservationToUpdate = await prisma.reservation.findFirst({
      where: {
        id: params.reservationId,
        userId: session.user.id, // Garante que o cliente só pode cancelar a sua própria reserva
      },
    });

    if (!reservationToUpdate) {
      return new NextResponse(
        'Reserva não encontrada ou não pertence a este utilizador',
        { status: 404 }
      );
    }

    // 3. Regra de negócio: Só pode cancelar se estiver pendente
    if (reservationToUpdate.status !== ReservationStatus.PENDING) {
      return new NextResponse('Esta reserva não pode mais ser cancelada', {
        status: 403,
      });
    }

    // 4. Iniciar uma transação para garantir a consistência dos dados
    const [updatedReservation] = await prisma.$transaction([
      // Atualiza o status da reserva para 'CANCELED'
      prisma.reservation.update({
        where: {
          id: params.reservationId,
        },
        data: {
          status: ReservationStatus.CANCELED,
        },
      }),
      // Atualiza o status do produto de volta para 'AVAILABLE'
      prisma.product.update({
        where: {
          id: reservationToUpdate.productId,
        },
        data: {
          isReserved: false,
        },
      }),
    ]);

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('[RESERVATION_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

/**
 * DELETE /api/reservations/[reservationId]
 * Permite que um VENDEDOR remova/rejeite uma reserva feita em um de seus produtos.
 * Esta ação remove completamente o registo da reserva.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Validação de segurança e de dados
    if (!session?.user?.id) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    if (!params.reservationId) {
      return new NextResponse('ID da reserva não encontrado', { status: 400 });
    }

    // 2. Encontrar a reserva e o produto associado para verificar a propriedade
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: params.reservationId,
      },
      select: {
        productId: true,
        product: {
          select: {
            userId: true, // ID do Vendedor
          },
        },
      },
    });

    if (!reservation) {
      return new NextResponse('Reserva não encontrada', { status: 404 });
    }

    // 3. Regra de negócio: Apenas o vendedor do produto pode deletar a reserva
    if (reservation.product.userId !== session.user.id) {
      return new NextResponse(
        'Ação não permitida. Apenas o vendedor do produto pode remover esta reserva.',
        { status: 403 }
      );
    }

    // 4. Iniciar uma transação para garantir a consistência dos dados
    const [deletedReservation] = await prisma.$transaction([
      // Deleta a reserva
      prisma.reservation.delete({
        where: {
          id: params.reservationId,
        },
      }),
      // Atualiza o produto para ficar disponível novamente
      prisma.product.update({
        where: {
          id: reservation.productId,
        },
        data: {
          isReserved: false,
        },
      }),
    ]);

    return NextResponse.json(deletedReservation);
  } catch (error) {
    console.error('[RESERVATION_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
