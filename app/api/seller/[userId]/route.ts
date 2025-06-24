import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest, 
    { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'ID do vendedor não fornecido.' }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({
      where: {
        id: userId,
        role: 'SELLER',
        // <<< CONDIÇÃO FUNDAMENTAL: Apenas retorna dados se o vendedor estiver público >>>
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
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
