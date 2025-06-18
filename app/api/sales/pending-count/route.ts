import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole, ReservationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Se não houver sessão ou o usuário não for um vendedor, retorna 0.
    if (!session?.user?.id || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ count: 0 });
    }

    // Conta as reservas com status PENDING que pertencem aos produtos do vendedor.
    const pendingCount = await prisma.reservation.count({
      where: {
        product: {
          userId: session.user.id,
        },
        status: ReservationStatus.PENDING,
      },
    });

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error("[PENDING_SALES_COUNT_ERROR]", error);
    // Em caso de erro, retorna 0 para não quebrar a UI.
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}