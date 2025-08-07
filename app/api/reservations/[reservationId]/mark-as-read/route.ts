import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Rota PATCH para marcar uma notificação de reserva como lida
export async function PATCH(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  const session = await getServerSession(authOptions);
  const { reservationId } = params;

  // Garante que apenas um admin pode realizar esta ação
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
  }

  if (!reservationId) {
    return NextResponse.json({ error: 'ID da reserva não fornecido.' }, { status: 400 });
  }

  try {
    const updatedReservation = await prisma.reservation.update({
      where: {
        id: reservationId,
      },
      data: {
        readByAdmin: true,
      },
    });

    return NextResponse.json(updatedReservation, { status: 200 });
  } catch (error) {
    console.error("Erro ao marcar reserva como lida:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}