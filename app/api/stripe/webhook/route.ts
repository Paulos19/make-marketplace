import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { SubscriptionStatus, PurchaseType } from '@prisma/client';
import { sendStripePurchaseConfirmationEmail } from '@/lib/resend';
import { revalidatePath } from 'next/cache';

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

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    console.error(`Webhook signature verification failed:`, error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata;
    const userId = metadata?.userId;
    if (!userId) {
      console.error('Webhook Error: userId not found in session metadata.', { metadata });
      return new NextResponse('Webhook Error: userId not found in metadata.', { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      console.error(`Webhook Error: User or email not found for userId: ${userId}`);
      return new NextResponse(`Webhook Error: User or email not found.`, { status: 404 });
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    if (!lineItems.data.length) {
        console.error('Webhook Error: No line items found in checkout session.');
        return new NextResponse('Webhook Error: No line items found.', { status: 400 });
    }
    const firstItem = lineItems.data[0];
    const planName = firstItem.description || 'Plano Personalizado';
    const price = firstItem.price?.unit_amount ? (firstItem.price.unit_amount / 100).toFixed(2) : '0.00';

    if (session.mode === 'subscription') {
      if (!session.subscription) {
        console.error('Webhook Error: Subscription ID not found for subscription mode.', { sessionId: session.id });
        return new NextResponse('Webhook Error: Subscription ID not found.', { status: 400 });
      }
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      const dataToUpdate: any = {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeSubscriptionStatus: toPrismaSubscriptionStatus(subscription.status),
      };
      if ((subscription as any).current_period_end) {
        dataToUpdate.stripeCurrentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      }
      
      await prisma.user.update({ where: { id: userId }, data: dataToUpdate });

      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard');
      revalidatePath(`/seller/${userId}`);

      await sendStripePurchaseConfirmationEmail({ to: user.email, userName: user.name, planName, price: `R$ ${price} /mês`, isSubscription: true });
    
    } else if (session.mode === 'payment') {
      const productId = metadata?.productId;
      const purchaseType = metadata?.purchaseType as PurchaseType;
      
      if (!session.payment_intent) {
        console.error('Webhook Error: Payment Intent ID not found.', { sessionId: session.id });
        return new NextResponse('Webhook Error: Payment Intent ID not found.', { status: 400 });
      }
      if (!purchaseType) {
        console.error('Webhook Error: purchaseType not found in session metadata.', { metadata });
        return new NextResponse('Webhook Error: purchaseType not found in metadata.', { status: 400 });
      }

      if (purchaseType === PurchaseType.ACHADINHO_TURBO && productId) {
        const boostedUntil = new Date();
        boostedUntil.setDate(boostedUntil.getDate() + 7);
        await prisma.product.update({ where: { id: productId }, data: { boostedUntil } });
        
        revalidatePath('/');
        revalidatePath('/dashboard');
      }

      if (purchaseType === PurchaseType.CARROSSEL_PRACA) {
        revalidatePath('/dashboard');
      }

      await prisma.purchase.create({
        data: { userId, productId, type: purchaseType, status: 'PAID', stripePaymentIntentId: session.payment_intent as string },
      });

      await sendStripePurchaseConfirmationEmail({ to: user.email, userName: user.name, planName, price: `R$ ${price}`, isSubscription: false });
    }
  }

  // ... outros eventos ...

  return new NextResponse(null, { status: 200 });
}
