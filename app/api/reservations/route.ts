// app/api/reservations/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route'; 
import { sendReservationNotificationEmail } from '@/lib/resend';

const reservationSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.name || !session.user?.email) {
      return NextResponse.json({ message: 'Autenticação necessária' }, { status: 401 });
    }

    const body = await request.json();
    const validation = reservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Input inválido', errors: validation.error.errors }, { status: 400 });
    }

    const { productId, quantity: reservedQuantity } = validation.data;
    const clientId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // << LÓGICA CORRIGIDA >>
      // Busca o produto e inclui o usuário (vendedor) diretamente
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          user: { // Inclui o vendedor
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      });

      if (!product) throw new Error('Produto não encontrado');
      if (!product.user || !product.user.email) throw new Error('Vendedor do produto não encontrado ou sem email.');
      if (product.quantity < reservedQuantity) throw new Error('Estoque insuficiente');

      const reservation = await tx.reservation.create({
        data: {
          userId: clientId,
          productId,
          quantity: reservedQuantity,
          status: 'PENDING',
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { quantity: { decrement: reservedQuantity } },
      });

      return { reservation, productOwner: product.user, productName: product.name };
    });

    // Enviar email para o vendedor
    await sendReservationNotificationEmail({
      sellerEmail: result.productOwner.email!,
      sellerName: result.productOwner.name,
      clientName: session.user!.name,
      clientContact: session.user!.email,
      productName: result.productName,
      quantity: reservedQuantity,
      productId: productId,
    });

    return NextResponse.json(result.reservation, { status: 201 });

  } catch (error: any) {
    console.error("Reservation creation error:", error);
    return NextResponse.json({ error: error.message || 'Não foi possível criar a reserva' }, { status: 500 });
  }
}

// GET: Busca as reservas do comprador logado (lógica inalterada, já estava correta)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: session.user.id },
      include: {
        product: { select: { id: true, name: true, images: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reservations, { status: 200 });

  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ message: 'Não foi possível buscar as reservas' }, { status: 500 });
  }
}