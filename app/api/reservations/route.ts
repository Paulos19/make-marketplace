import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route'; 
import { Resend } from 'resend';

// Supondo que você tenha um componente de e-mail para notificação.
// Se não tiver, esta parte pode ser adaptada ou removida.
// import { ReservationNotificationEmail } from '@/app/components/emails/ReservationNotificationEmail';

// Inicializa o Resend se a chave estiver disponível
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Função para enviar e-mail (adapte para o seu componente de e-mail)
async function sendReservationNotificationEmail(params: {
  sellerEmail: string;
  sellerName: string | null;
  clientName: string | null;
  productName: string;
  quantity: number;
}) {
  if (!resend) {
    console.log("Chave RESEND_API_KEY não configurada. E-mail de notificação não enviado.");
    return;
  }
  // Adapte o conteúdo do e-mail conforme necessário
  await resend.emails.send({
    from: 'Zacaplace <naoresponda@zacaplace.com.br>',
    to: params.sellerEmail,
    subject: `Nova reserva do produto: ${params.productName}`,
    html: `<p>Olá, ${params.sellerName || 'vendedor'}!</p><p>Você recebeu uma nova reserva de ${params.clientName} para o produto "${params.productName}" (Quantidade: ${params.quantity}).</p><p>Acesse seu painel para mais detalhes.</p>`,
  });
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id || !session.user.name || !session.user.email) {
      return NextResponse.json({ message: 'Autenticação necessária ou dados do usuário ausentes na sessão.' }, { status: 401 });
    }

    const reservationSchema = z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    });

    const body = await request.json();
    const validation = reservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Input inválido', errors: validation.error.errors }, { status: 400 });
    }

    const { productId, quantity: reservedQuantity } = validation.data;
    const buyerId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { 
            user: { // Inclui os dados do vendedor (dono do produto)
                select: {
                    id: true,
                    name: true,
                    storeName: true,
                    email: true,
                    whatsappLink: true
                }
            } 
        }
      });

      if (!product) throw new Error('Produto não encontrado.');
      if (!product.user || !product.user.email) throw new Error('Vendedor do produto não encontrado ou sem email.');
      if (product.quantity < reservedQuantity) throw new Error('Estoque insuficiente para a quantidade solicitada.');

      // O comprador é o usuário da sessão atual
      const buyer = await tx.user.findUnique({
        where: { id: buyerId }
      });

      if (!buyer) {
        throw new Error(`Falha de autenticação: O usuário com ID ${buyerId} não foi encontrado.`);
      }
      
      const reservation = await tx.reservation.create({
        data: {
          userId: buyerId,
          productId,
          quantity: reservedQuantity,
          status: 'PENDING',
        },
      });
      
      // --- CORREÇÃO APLICADA AQUI ---
      // Cria a notificação para o admin com o METADATA preenchido corretamente
      const adminMessage = `${product.user.storeName || product.user.name}, chegou uma nova reserva do "${product.name}" (Qtd: ${reservedQuantity}) por ${buyer.name}, no Zacaplace.`;
      
      await tx.adminNotification.create({
          data: {
              message: adminMessage,
              type: 'RESERVATION',
              reservationId: reservation.id,
              sellerId: product.userId,
              sellerWhatsappLink: product.user.whatsappLink,
              // O campo metadata agora é preenchido com todos os detalhes
              metadata: {
                  productId: product.id,
                  productName: product.name,
                  productImage: product.images[0] || null,
                  quantity: reservedQuantity,
                  buyerName: buyer.name,
              }
          }
      });

      return { reservation, productOwner: product.user, productName: product.name, buyerName: buyer.name };
    });

    // Envia e-mail de notificação para o vendedor (se configurado)
    await sendReservationNotificationEmail({
      sellerEmail: result.productOwner.email!,
      sellerName: result.productOwner.storeName || result.productOwner.name,
      clientName: result.buyerName,
      productName: result.productName,
      quantity: reservedQuantity,
    });
    
    return NextResponse.json(result.reservation, { status: 201 });

  } catch (error: any) {
    console.error("Reservation creation error:", error);
    return NextResponse.json({ error: error.message || 'Não foi possível criar a reserva' }, { status: 500 });
  }
}