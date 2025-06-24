import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { SubscriptionStatus, PurchaseType, User } from '@prisma/client';
import { sendStripePurchaseConfirmationEmail } from '@/lib/resend';

/**
 * Mapeia o status da assinatura do Stripe para o enum correspondente do Prisma.
 * @param stripeStatus O status recebido da API do Stripe.
 * @returns O status do enum do Prisma.
 */
function toPrismaSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    past_due: SubscriptionStatus.PAST_DUE,
    trialing: SubscriptionStatus.TRIALING,
    unpaid: SubscriptionStatus.UNPAID,
    paused: SubscriptionStatus.CANCELED,
  };
  return statusMap[stripeStatus] || SubscriptionStatus.CANCELED;
}

/**
 * Manipulador de Webhooks do Stripe.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`❌ Erro na verificação do Webhook: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // --- Lidar com a finalização de um checkout ---
  if (event.type === 'checkout.session.completed') {
    const userId = session?.metadata?.userId;

    if (!userId) {
      return new NextResponse('Webhook Error: ID do usuário não encontrado.', { status: 400 });
    }
    
    // --- Busca os dados do usuário para o email ---
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user || !user.email) {
        return new NextResponse('Webhook Error: Usuário ou email não encontrado no DB.', { status: 404 });
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const firstItem = lineItems.data[0];
    const planName = firstItem.description || 'Plano Personalizado';
    const price = firstItem.price?.unit_amount ? (firstItem.price.unit_amount / 100).toFixed(2) : '0.00';

    // --- LÓGICA PARA ASSINATURAS ---
    if (session.mode === 'subscription') {
      if (!session.subscription) {
        return new NextResponse('Webhook Error: ID da assinatura não encontrado para o modo de assinatura.', { status: 400 });
      }
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const periodEndTimestamp = (subscription as any).current_period_end;
      const dataToUpdate: any = {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
      };

      if (periodEndTimestamp) {
        dataToUpdate.stripeCurrentPeriodEnd = new Date(periodEndTimestamp * 1000);
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
      
      await sendStripePurchaseConfirmationEmail({
          to: user.email,
          userName: user.name,
          planName,
          price: `R$ ${price} /mês`,
          isSubscription: true
      });
    }
    // --- LÓGICA PARA PAGAMENTOS ÚNICOS ---
    else if (session.mode === 'payment') {
      const productId = session?.metadata?.productId;
      const purchaseType = (session?.metadata?.purchaseType as PurchaseType) || PurchaseType.ACHADINHO_TURBO;
      
      if (!session.payment_intent) {
        return new NextResponse('Webhook Error: ID da intenção de pagamento não encontrado.', { status: 400 });
      }

      if (productId) {
        const boostDurationDays = 7;
        const boostedUntil = new Date();
        boostedUntil.setDate(boostedUntil.getDate() + boostDurationDays);

        await prisma.product.update({
          where: { id: productId },
          data: {
            boostedUntil: boostedUntil,
          },
        });
      }

      await prisma.purchase.create({
        data: {
          userId,
          productId,
          type: purchaseType,
          status: 'PAID',
          stripePaymentIntentId: session.payment_intent as string,
        },
      });
      
      await sendStripePurchaseConfirmationEmail({
        to: user.email,
        userName: user.name,
        planName,
        price: `R$ ${price}`,
        isSubscription: false
      });
    }
  }

  // --- Lidar com renovações de assinatura pagas com sucesso ---
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription;
    
    if (subscriptionId && typeof invoice.customer === 'string') {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const periodEndTimestamp = (subscription as any).current_period_end;
      const dataToUpdate: any = {
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
      };

      if (periodEndTimestamp) {
        dataToUpdate.stripeCurrentPeriodEnd = new Date(periodEndTimestamp * 1000);
      }

      await prisma.user.update({
        where: {
          stripeCustomerId: invoice.customer,
        },
        data: dataToUpdate,
      });
    }
  }

  // --- Lidar com atualizações ou exclusões de assinaturas ---
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      const periodEndTimestamp = (subscription as any).current_period_end;
      const dataToUpdate: any = {
        stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
        stripePriceId: subscription.items.data[0]?.price.id,
      };

      if (periodEndTimestamp) {
        dataToUpdate.stripeCurrentPeriodEnd = new Date(periodEndTimestamp * 1000);
      }

      await prisma.user.update({
          where: {
              stripeSubscriptionId: subscription.id,
          },
          data: dataToUpdate,
      });
  }

  return new NextResponse(null, { status: 200 });
}
