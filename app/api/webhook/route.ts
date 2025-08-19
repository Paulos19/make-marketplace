// app/api/webhook/route.ts (MODIFICADO)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.pix || data.pix.length === 0) {
      return NextResponse.json({ message: 'Nenhuma notificação PIX recebida' }, { status: 200 });
    }

    const pixTransaction = data.pix[0];
    const { txid, endToEndId, valor, horario } = pixTransaction;

    // 1. Verificar se este webhook já foi processado pelo txid
    const existingWebhook = await prisma.pixWebhook.findUnique({ where: { txid } });
    if (existingWebhook) {
      return NextResponse.json({ message: 'Webhook já processado' }, { status: 200 });
    }

    // 2. Salvar o payload do webhook para auditoria
    await prisma.pixWebhook.create({
      data: { txid, endToEndId, valor, horario: new Date(horario), pix: pixTransaction },
    });

    // 3. Encontrar o pagamento pendente no sistema
    const pixPayment = await prisma.pixPayment.findUnique({
      where: { txid },
      include: { purchase: true },
    });

    if (!pixPayment || pixPayment.status === 'CONFIRMED') {
        console.warn(`Webhook recebido para txid ${txid} não encontrado ou já confirmado.`);
        return NextResponse.json({ status: "ok" });
    }

    // 4. Iniciar uma transação para garantir a consistência dos dados
    await prisma.$transaction(async (tx) => {
      // Atualizar o status do pagamento e da compra
      await tx.pixPayment.update({
        where: { id: pixPayment.id },
        data: { status: 'CONFIRMED' },
      });
      await tx.purchase.update({
        where: { id: pixPayment.purchaseId },
        data: { status: 'PAID' },
      });

      // 5. Executar a lógica de negócio baseada no tipo de compra
      const purchase = pixPayment.purchase;
      if (purchase && purchase.productId) {
        const now = new Date();
        if (purchase.type === 'ACHADINHO_TURBO') {
          await tx.product.update({
            where: { id: purchase.productId },
            data: { boostedUntil: addDays(now, 7) }, // Exemplo: Boost por 7 dias
          });
        } else if (purchase.type === 'CARROSSEL_PRACA') {
          await tx.product.update({
            where: { id: purchase.productId },
            data: { carouselUntil: addDays(now, 7) }, // Exemplo: Carrossel por 7 dias
          });
        }
      }
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error('Erro ao processar webhook PIX:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}