import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      console.error('API Error: userId not found in params.');
      return NextResponse.json({ error: 'ID do vendedor não fornecido.' }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({
      where: {
        id: userId,
        role: UserRole.SELLER,
        showInSellersPage: true,
      },
      include: {
        products: {
          where: {
            isSold: false,
            isReserved: false,
          },
          include: {
            category: true,
            user: true,
          },
           orderBy: {
            createdAt: 'desc'
          }
        },
        reviewsReceived: {
          include: {
            buyer: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor não encontrado ou não está visível publicamente.' }, { status: 404 });
    }

    return NextResponse.json(seller)
  } catch (error) {
    console.error(`Erro ao buscar dados do vendedor:`, error)
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a solicitação.' }, { status: 500 });
  }
}
