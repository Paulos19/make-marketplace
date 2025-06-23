import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

// Schema para validar os dados recebidos no corpo da requisição
const checkoutSchema = z.object({
  priceId: z.string(),
  productId: z.string().optional(), // Opcional, para planos avulsos
  type: z.enum(['subscription', 'payment']), // CORREÇÃO: 'one_time' alterado para 'payment'
});

export async function POST(request: Request) {
  try {
    // 1. Validar a requisição e o corpo
    const body = await request.json();

    // Uma verificação manual do tipo antes do Zod para garantir que o mapeamento ocorra
    if (body.type === 'one_time') {
        body.type = 'payment';
    }

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }
    const { priceId, productId, type } = validation.data;

    // 2. Autenticar o usuário
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return new NextResponse('Não autorizado', { status: 401 });
    }
    const userId = session.user.id;
    const userEmail = session.user.email;

    // 3. Buscar o usuário no banco de dados para obter o stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // 4. Criar um cliente no Stripe se ainda não existir
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: session.user.name || undefined,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Atualiza o nosso banco de dados com o ID do cliente Stripe
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: stripeCustomerId },
      });
    }
    
    // 5. Obter a URL base da aplicação para os redirecionamentos
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 6. Criar a sessão de checkout no Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: type, // O 'type' agora será 'subscription' ou 'payment'
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/planos?payment=cancelled`,
      metadata: {
        userId,
        // Adiciona o ID do produto se for uma compra avulsa (modo 'payment')
        ...(type === 'payment' && productId && { productId }),
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Não foi possível criar a sessão de checkout.' }, { status: 500 });
    }

    // 7. Retornar a URL da sessão para o frontend
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
