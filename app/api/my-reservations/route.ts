import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            // CORREÇÃO APLICADA AQUI
            user: {
              select: {
                id: true,
                name: true,
                whatsappLink: true
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('[MY_RESERVATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}