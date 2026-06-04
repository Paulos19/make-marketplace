import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserId } from '../../../auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const [reviews, aggregation] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId },
        include: {
          user: {
            select: { id: true, name: true, image: true, storeName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Calculate distribution (5,4,3,2,1 stars)
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating]++;
      }
    });

    return NextResponse.json({
      reviews,
      averageRating: aggregation._avg.rating || 0,
      totalReviews: aggregation._count.rating || 0,
      distribution,
    });
  } catch (error) {
    console.error('[PRODUCT_REVIEWS_GET]', error);
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const userId = await getMobileUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment, images } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'A avaliação deve ser entre 1 e 5 estrelas' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Prevent reviewing own product
    if (product.userId === userId) {
      return NextResponse.json({ error: 'Você não pode avaliar seu próprio produto' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existing = await prisma.productReview.findFirst({
      where: { productId, userId }
    });
    if (existing) {
      return NextResponse.json({ error: 'Você já avaliou este produto' }, { status: 400 });
    }

    const review = await prisma.productReview.create({
      data: {
        rating: Math.round(rating),
        comment: comment || null,
        images: images || [],
        productId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, storeName: true }
        }
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('[PRODUCT_REVIEWS_POST]', error);
    return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 });
  }
}
