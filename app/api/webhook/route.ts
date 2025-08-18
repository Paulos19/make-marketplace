import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    console.log('Webhook recebido:', JSON.stringify(notification, null, 2));

    if (!notification?.pix?.length) {
      return NextResponse.json({ message: 'Notificação recebida, mas sem dados PIX válidos.' }, { status: 200 });
    }

    // Itera sobre cada pagamento na notificação (geralmente vem apenas um)
    for (const pix of notification.pix) {
      const { txid, valor, endToEndId, horario } = pix;

      if (!txid) {
        console.warn('Webhook PIX recebido sem txid:', pix);
        continue;
      }

      // Verifica se este pagamento já foi salvo para evitar duplicidade
      const existingPayment = await prisma.pixWebhook.findUnique({
        where: { txid },
      });

      if (existingPayment) {
        console.log(`[Webhook] Pagamento para txid ${txid} já existe no banco. Ignorando.`);
        continue;
      }

      // Cria um novo registro no banco de dados com os dados do pagamento
      await prisma.pixWebhook.create({
        data: {
          txid: txid,
          endToEndId: endToEndId,
          valor: parseFloat(valor),
          horario: new Date(horario),
          status: 'COMPLETED',
          payload: pix, // Salva o objeto completo do pix para auditoria
        },
      });

      console.log(`[Webhook] Pagamento com txid ${txid} foi salvo com sucesso no banco de dados.`);
    }

    // Responde à EFI confirmando o recebimento
    return NextResponse.json({ message: 'Webhook processado com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error(`[Webhook] Erro fatal durante o processamento:`, error.message);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
