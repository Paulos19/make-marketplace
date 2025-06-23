import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Mapeia o status da assinatura do Stripe para o enum correspondente do Prisma.
 * @param stripeStatus O status recebido da API do Stripe.
 * @returns O status do enum do Prisma.
 */
function toPrismaSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    // O status 'paused' não está no seu enum, mas pode ser um caso a tratar no futuro.
    default:
      // Se um novo status for introduzido pelo Stripe, isso lançará um erro,
      // o que é bom para nos alertar a atualizar nosso enum.
      throw new Error(`Unhandled Stripe subscription status: ${stripeStatus}`);
  }
}


/**
 * Manipulador de Webhooks do Stripe.
 * Esta rota recebe eventos do Stripe e atualiza o banco de dados da aplicação.
 */
export async function POST(req: Request) {
  // O corpo precisa ser lido como texto bruto para a verificação da assinatura
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  // 1. Verificar a assinatura do webhook para garantir que a requisição veio do Stripe
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
  
  // 2. Lidar com o evento 'checkout.session.completed'
  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Verifica se os metadados necessários estão presentes
    if (!session?.metadata?.userId) {
      return new NextResponse('ID do usuário nos metadados do Webhook não encontrado', { status: 400 });
    }

    // Atualiza o registro do usuário com os detalhes da assinatura
    await prisma.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
      },
    });
  }

  // 3. Lidar com o evento 'invoice.payment_succeeded'
  // Este evento ocorre quando uma renovação de assinatura é paga com sucesso
  if (event.type === 'invoice.payment_succeeded') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Atualiza a data de término do período da assinatura do usuário
    await prisma.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0]?.price.id,
      },
    });
  }

  // 4. Lidar com outros eventos de assinatura (atualização, cancelamento, etc.)
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.update({
          where: {
              stripeSubscriptionId: subscription.id,
          },
          data: {
              // CORREÇÃO: Usa a função auxiliar para mapear o status
              stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
              // Se a assinatura for cancelada, podemos limpar a data de término
              ...(subscription.status === 'canceled' && { stripeCurrentPeriodEnd: null }),
          },
      });
  }

  // Retorna uma resposta 200 para confirmar o recebimento do evento
  return new NextResponse(null, { status: 200 });
}
