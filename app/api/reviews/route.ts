import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  token: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { rating, comment, token } = validation.data;

    // Utiliza uma transação para garantir a atomicidade das operações
    const newReview = await prisma.$transaction(async (tx) => {
      // 1. Encontra a reserva usando o token
      const reservation = await tx.reservation.findUnique({
        where: { reviewToken: token },
        include: {
          product: { select: { userId: true } }, // userId do vendedor
          review: true,
        },
      });

      // 2. Validações
      if (!reservation || reservation.userId !== session.user?.id) {
        throw new Error('Reserva inválida ou não pertence a você.');
      }
      if (reservation.review) {
        throw new Error('Esta reserva já foi avaliada.');
      }

      // 3. Cria a nova avaliação
      const createdReview = await tx.review.create({
        data: {
          rating,
          comment,
          reservationId: reservation.id,
          sellerId: reservation.product.userId,
          buyerId: session.user.id,
        },
      });

      // 4. Invalida o token para prevenir múltiplas avaliações
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { reviewToken: null },
      });
      
      return createdReview;
    });

    return NextResponse.json(newReview, { status: 201 });

  } catch (error) {
    console.error('[REVIEWS_POST_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar avaliação.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
