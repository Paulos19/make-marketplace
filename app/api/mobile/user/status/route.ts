import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { SubscriptionStatus, PurchaseType } from '@prisma/client';
import { getMobileUserId } from '../../auth-helper';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const userId = await getMobileUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    const boostedProducts = await prisma.product.findMany({
      where: {
        userId: userId,
        boostedUntil: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        boostedUntil: true,
      },
    });

    const availableCarouselPurchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
        type: PurchaseType.CARROSSEL_PRACA,
        submissionStatus: "AVAILABLE"
      },
      select: {
        id: true,
        createdAt: true,
      }
    });

    const hasActiveSubscription = user?.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;
    
    return NextResponse.json({
      hasActiveSubscription,
      subscriptionEndDate: user?.stripeCurrentPeriodEnd,
      boostedProducts,
      availableCarouselPurchases,
    });
    
  } catch (error) {
    console.error('Erro ao buscar status do usuário mobile:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar o status da conta.' },
      { status: 500 }
    );
  }
}
