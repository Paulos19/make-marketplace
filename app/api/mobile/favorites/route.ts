import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getMobileUserId } from '../auth-helper';

const favoriteSchema = z.object({
  productId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  const userId = await getMobileUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = favoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { productId } = validation.data;

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
    console.error('Erro ao adicionar aos favoritos mobile:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = await getMobileUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                storeName: true,
              }
            },
            productReviews: {
              select: {
                rating: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFavorites = favorites.map(f => {
      const p = f.product;
      const totalReviews = p.productReviews ? p.productReviews.length : 0;
      const averageRating = totalReviews > 0 
        ? p.productReviews.reduce((acc: any, rev: any) => acc + rev.rating, 0) / totalReviews 
        : 4.9; // Default if none, or could be 0

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        images: p.images,
        condition: p.condition,
        onPromotion: p.onPromotion,
        isService: p.isService,
        user: p.user,
        averageRating,
        totalReviews
      };
    });

    return NextResponse.json(formattedFavorites);
  } catch (error) {
    console.error('Erro ao listar favoritos mobile:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
