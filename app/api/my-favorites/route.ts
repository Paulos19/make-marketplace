import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Rota GET para buscar todos os favoritos de um usuário
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      // Incluímos os detalhes do produto para exibir no card
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            priceType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Mostra os mais recentes primeiro
      },
    });

    return NextResponse.json(favorites);

  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar favoritos.' }, { status: 500 });
  }
}