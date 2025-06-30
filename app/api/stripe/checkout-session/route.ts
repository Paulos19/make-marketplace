import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { PurchaseType } from '@prisma/client';
import Stripe from 'stripe';

async function createStripeCustomer(user: { id: string; email: string | null; name?: string | null; }) {
    if (!user.email) {
        throw new Error("User email is required to create a Stripe customer.");
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


export async function POST(req: Request) {
  try {
    const { priceId, productId, type: mode } = await req.json();
    
    if (!priceId || !mode) {
      return new NextResponse('Price ID e mode (type) são obrigatórios.', { status: 400 });
    }
    if (mode !== 'subscription' && mode !== 'payment') {
        return new NextResponse("O 'mode' (type) deve ser 'subscription' ou 'payment'.", { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return new NextResponse('Não autorizado', { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return new NextResponse('Usuário não encontrado', { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (stripeCustomerId) {
        try {
            // Attempt to retrieve the customer from Stripe
            await stripe.customers.retrieve(stripeCustomerId);
        } catch (error) {
            // If retrieval fails (e.g., customer not found), create a new one
            console.warn(`Stripe customer ${stripeCustomerId} not found or invalid. Creating a new customer.`);
            stripeCustomerId = await createStripeCustomer(user);
        }
    } else {
        // If no stripeCustomerId in DB, create a new one
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
            return new NextResponse('Erro de configuração do produto.', { status: 500 });
        }
        metadata.purchaseType = purchaseType;
    }

    const createCheckoutSession = async (customerId: string) => {
        return stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          billing_address_collection: 'required',
          line_items: [{ price: priceId, quantity: 1 }],
          mode: mode,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos?payment_canceled=true`,
          metadata: metadata,
        });
    }

    const stripeSession = await createCheckoutSession(stripeCustomerId);
    
    if (!stripeSession.url) {
        return new NextResponse('Falha ao obter URL da sessão do Stripe.', { status: 500 });
    }

    return NextResponse.json({ url: stripeSession.url });

  } catch (error: unknown) {
    const errorMessage = (error instanceof Error && 'raw' in error) 
      // @ts-expect-error
      ? error.raw?.message 
      : (error instanceof Error ? error.message : 'Erro interno ao criar sessão');
    
    console.error("Erro ao criar sessão de checkout do Stripe:", errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}