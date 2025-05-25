import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';

const reservationSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  // Não precisamos de status aqui, será PENDING por padrão
});

// Handler para criar uma nova reserva
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = reservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { productId, quantity: reservedQuantity } = validation.data;
    const userId = session.user.id;

    // Transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.quantity < reservedQuantity) {
        throw new Error('Not enough stock available');
      }

      // Criar a reserva
      const reservation = await tx.reservation.create({
        data: {
          userId,
          productId,
          quantity: reservedQuantity,
          status: 'PENDING', // Status inicial da reserva
        },
      });

      // Atualizar a quantidade do produto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: {
            decrement: reservedQuantity,
          },
        },
      });

      return { reservation, updatedProduct };
    });

    return NextResponse.json(result.reservation, { status: 201 });

  } catch (error) {
    console.error("Reservation error:", error);
    if (error instanceof Error && (error.message === 'Product not found' || error.message === 'Not enough stock available')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Could not create reservation' }, { status: 500 });
  }
}

// Novo Handler GET para buscar reservas do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdFromQuery = searchParams.get('userId');

    // Idealmente, o usuário só pode buscar suas próprias reservas.
    // Se um admin pudesse buscar por qualquer userId, essa verificação seria diferente.
    if (userIdFromQuery !== session.user.id) {
        // Ou poderia simplesmente ignorar o userIdFromQuery e usar sempre o session.user.id
        // return NextResponse.json({ message: 'Forbidden: You can only fetch your own reservations.' }, { status: 403 });
        // Por simplicidade, vamos assumir que se userId é fornecido, ele deve corresponder ao usuário logado
        // ou, se não fornecido, usa o usuário logado.
        // Para o caso da dashboard, o userIdFromQuery será o do usuário logado.
    }

    const targetUserId = session.user.id; // Garante que estamos buscando para o usuário logado

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
        createdAt: 'desc', // Mostrar as mais recentes primeiro
      },
    });

    return NextResponse.json(reservations, { status: 200 });

  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ message: 'Could not fetch reservations' }, { status: 500 });
  }
}