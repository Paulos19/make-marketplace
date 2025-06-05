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

    // Proteção: Apenas usuários logados e com a role SELLER ou ADMIN podem acessar
    if (!session?.user?.id || (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const sellerId = session.user.id;

    const sales = await prisma.reservation.findMany({
      where: {
        // << LÓGICA CORRIGIDA >>
        // Filtra as reservas onde o produto pertence ao 'userId' do vendedor logado
        product: {
          userId: sellerId,
        },
      },
      include: {
        product: { // Inclui detalhes do produto
          select: {
            id: true,
            name: true,
            imageUrls: true,
          },
        },
        user: { // Inclui detalhes do comprador (user) que fez a reserva
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

    return NextResponse.json(sales, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar vendas do vendedor:", error);
    return NextResponse.json({ message: 'Não foi possível buscar as vendas' }, { status: 500 });
  }
}