// app/api/reservations/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma'; //
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route'; ///route.ts]
import { sendReservationNotificationEmail } from '@/lib/nodemailer'; // << Importar a função

const reservationSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.name || !session.user?.email) { // Garantir que temos nome e email do cliente
      return NextResponse.json({ message: 'Autenticação necessária ou dados do usuário incompletos na sessão.' }, { status: 401 });
    }

    const body = await request.json();
    const validation = reservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { productId, quantity: reservedQuantity } = validation.data;
    const clientId = session.user.id;
    const clientName = session.user.name;
    const clientContact = session.user.email; // Ou session.user.whatsappLink se preferir/tiver

    // Transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { // Incluir dados do vendedor (dono do produto)
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      });

      if (!product) {
        throw new Error('Produto não encontrado (Product not found)');
      }
      if (!product.user || !product.user.email) {
        throw new Error('Vendedor do produto não encontrado ou sem email cadastrado.');
      }

      if (product.quantity < reservedQuantity) {
        throw new Error('Estoque insuficiente (Not enough stock available)');
      }

      const reservation = await tx.reservation.create({
        data: {
          userId: clientId,
          productId,
          quantity: reservedQuantity,
          status: 'PENDING',
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: {
            decrement: reservedQuantity,
          },
        },
      });

      return { reservation, productOwner: product.user, productName: product.name };
    });

    // Enviar email APÓS a transação ser bem-sucedida
    if (result.productOwner.email) {
      await sendReservationNotificationEmail({
        sellerEmail: result.productOwner.email,
        sellerName: result.productOwner.name,
        clientName: clientName,
        clientContact: clientContact, // Enviar email do cliente como contato
        productName: result.productName,
        quantity: reservedQuantity,
        productId: productId,
      });
    } else {
      console.warn(`Email do vendedor para o produto ${result.productName} (ID: ${productId}) não encontrado. Notificação não enviada.`);
    }

    return NextResponse.json(result.reservation, { status: 201 });

  } catch (error) {
    console.error("Reservation error:", error);
    if (error instanceof Error) {
        if (error.message === 'Produto não encontrado (Product not found)' || 
            error.message === 'Estoque insuficiente (Not enough stock available)' ||
            error.message === 'Vendedor do produto não encontrado ou sem email cadastrado.') {
        return NextResponse.json({ message: error.message }, { status: 400 });
        }
    }
    return NextResponse.json({ message: 'Não foi possível criar a reserva (Could not create reservation)' }, { status: 500 });
  }
}

// GET Handler (permanece o mesmo da sua implementação anterior)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const targetUserId = session.user.id;

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrls: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reservations, { status: 200 });

  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ message: 'Could not fetch reservations' }, { status: 500 });
  }
}