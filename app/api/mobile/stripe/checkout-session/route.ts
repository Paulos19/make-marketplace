// app/api/mobile/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { PurchaseType } from '@prisma/client';
import { getMobileUserId } from '../../auth-helper';

async function createStripeCustomer(user: { id: string; email: string | null; name?: string | null; }) {
  if (!user.email) {
    throw new Error("O e-mail do usuário é obrigatório para criar um cliente no Stripe.");
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id }
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });
  return customer.id;
}

export async function POST(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'Não autorizado. Faça login novamente.' }, { status: 401 });
  }

  try {
    const { priceId, productId, type: mode } = await req.json();

    if (!priceId || !mode) {
      return NextResponse.json({ message: 'Price ID e mode (type) são obrigatórios.' }, { status: 400 });
    }
    if (mode !== 'subscription' && mode !== 'payment') {
      return NextResponse.json({ message: "O 'mode' (type) deve ser 'subscription' ou 'payment'." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        console.warn(`Stripe customer ${stripeCustomerId} not found or invalid. Creating a new customer.`);
        stripeCustomerId = await createStripeCustomer(user);
      }
    } else {
      stripeCustomerId = await createStripeCustomer(user);
    }

    const metadata: { [key: string]: string } = {
      userId: user.id,
    };

    if (mode === 'payment') {
      if (productId) {
        metadata.productId = productId;
      }

      let purchaseType: PurchaseType | null = null;
      if (priceId === process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID) {
        purchaseType = PurchaseType.ACHADINHO_TURBO;
      } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID) {
        purchaseType = PurchaseType.CARROSSEL_PRACA;
      }

      if (!purchaseType) {
        console.error(`ERRO DE CONFIGURAÇÃO: purchaseType não pôde ser determinado para o priceId: ${priceId}. Verifique as variáveis de ambiente.`);
        return NextResponse.json({ message: 'Erro de configuração do produto.' }, { status: 500 });
      }
      metadata.purchaseType = purchaseType;
    }

    const stripeSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos?payment_canceled=true`,
      metadata: metadata,
    });

    if (!stripeSession.url) {
      return NextResponse.json({ message: 'Falha ao obter URL da sessão do Stripe.' }, { status: 500 });
    }

    return NextResponse.json({ url: stripeSession.url });

  } catch (error: unknown) {
    const errorMessage = (error instanceof Error && 'raw' in error)
      ? (error as any).raw?.message
      : (error instanceof Error ? error.message : 'Erro interno ao criar sessão');

    console.error("Erro ao criar sessão de checkout do Stripe:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
