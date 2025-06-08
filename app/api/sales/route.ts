// app/api/sales/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';

// GET: Busca todas as reservas dos produtos de um vendedor
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const sellerId = session.user.id;

    const salesFromDb = await prisma.reservation.findMany({
      where: {
        product: {
          userId: sellerId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            // CORREÇÃO 1: Usar 'images', o nome correto do campo no schema do DB.
            images: true, 
          },
        },
        user: { 
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // CORREÇÃO 2: Normalizar os dados para enviar 'imageUrls' para o frontend.
    // Isso garante que o componente que exibe os dados não quebre.
    const sales = salesFromDb.map(sale => {
        // Pega o campo 'images' do produto e cria um novo campo 'imageUrls'
        const { images, ...restOfProduct } = sale.product;
        return {
            ...sale,
            product: {
                ...restOfProduct,
                imageUrls: images // Renomeia 'images' para 'imageUrls'
            }
        };
    });

    return NextResponse.json(sales, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar vendas do vendedor:", error);
    return NextResponse.json({ message: 'Não foi possível buscar as vendas' }, { status: 500 });
  }
}
