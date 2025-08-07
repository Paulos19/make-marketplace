// app/api/favorites/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const favoriteSchema = z.object({
  productId: z.string().cuid(),
});

// Adicionar um produto aos favoritos
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const validation = favoriteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { productId } = validation.data;
  const userId = session.user.id;

  try {
    // Verifica se já não está favoritado para evitar duplicatas
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ message: 'Produto já está nos favoritos' }, { status: 200 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar aos favoritos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}