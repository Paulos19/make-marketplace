import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route'; 
import { sendReservationNotificationEmail } from '@/lib/resend';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    const reservations = await prisma.reservation.findMany({
      where: { userId: session.user.id },
      include: {
        product: { 
          select: { 
            id: true, 
            name: true, 
            images: true, 
            price: true, 
            user: { select: { id: true, name: true, whatsappLink: true } } 
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ message: 'Não foi possível buscar as reservas' }, { status: 500 });
  }
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
    const clientId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { user: true }
      });

      if (!product) throw new Error('Produto não encontrado.');
      if (!product.user || !product.user.email) throw new Error('Vendedor do produto não encontrado ou sem email.');
      if (product.quantity < reservedQuantity) throw new Error('Estoque insuficiente para a quantidade solicitada.');

      const clientUser = await tx.user.findUnique({
        where: { id: clientId }
      });

      if (!clientUser) {
        throw new Error(`Falha de autenticação: O usuário com ID ${clientId} não foi encontrado no banco de dados.`);
      }
      

      const reservation = await tx.reservation.create({
        data: {
          userId: clientId,
          productId,
          quantity: reservedQuantity,
          status: 'PENDING',
        },
      });
      
      // Cria a notificação para o admin
      const adminMessage = `${product.user?.name}, chegou uma nova reserva do "${product.name}" (Qtd: ${reservedQuantity}) por ${session.user?.name}, no Zacaplace. Psit...! Corre lá, dá uma bizoiada, uai!`;
      await tx.adminNotification.create({
          data: {
              message: adminMessage,
              reservationId: reservation.id,
              sellerId: product.userId,
              sellerWhatsappLink: product.user.whatsappLink,
          }
      });

      return { reservation, productOwner: product.user, productName: product.name };
    });

    // Envia e-mail de notificação para o vendedor
    await sendReservationNotificationEmail({
      sellerEmail: result.productOwner.email!,
      sellerName: result.productOwner.name,
      clientName: session.user.name,
      clientContact: session.user.email,
      productName: result.productName,
      quantity: reservedQuantity,
      productId: productId,
    });
    
    return NextResponse.json(result.reservation, { status: 201 });

  } catch (error: any) {
    console.error("Reservation creation error:", error);
    // Retorna a mensagem de erro específica para o frontend
    return NextResponse.json({ error: error.message || 'Não foi possível criar a reserva' }, { status: 500 });
  }
}
