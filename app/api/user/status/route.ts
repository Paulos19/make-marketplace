import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { SubscriptionStatus, PurchaseType } from '@prisma/client';

export const revalidate = 0;

/**
 * Busca o status atual da assinatura e das compras ativas
 * do usuário logado, incluindo as datas de expiração.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Busca dados da assinatura diretamente do usuário, incluindo a data de término
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeSubscriptionStatus: true,
        stripeCurrentPeriodEnd: true, // <<< Data de término da assinatura
      },
    });

    // Busca produtos com boost ativo
    const boostedProducts = await prisma.product.findMany({
        where: {
            userId: session.user.id,
            boostedUntil: {
                gte: new Date(),
            },
        },
        select: {
            id: true,
            name: true,
            boostedUntil: true, // <<< Data de término do boost
        },
    });

    // Busca compras de carrossel disponíveis para uso
    const availableCarouselPurchases = await prisma.purchase.findMany({
        where: {
            userId: session.user.id,
            type: PurchaseType.CARROSSEL_PRACA,
            submissionStatus: "AVAILABLE"
        },
        select: {
            id: true,
            createdAt: true,
        }
    });

    const hasActiveSubscription = user?.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;
    const hasActiveTurboBoost = boostedProducts.length > 0;
    
    return NextResponse.json({
      hasActiveSubscription,
      subscriptionEndDate: user?.stripeCurrentPeriodEnd, // <<< Retorna a data de término
      boostedProducts,
      availableCarouselPurchases,
    });
    
  } catch (error) {
    console.error('Erro ao buscar status do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar o status da conta.' },
      { status: 500 }
    );
  }
}
