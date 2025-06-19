import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Extrai o ID do vendedor diretamente da URL da requisição
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 1]

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário (vendedor) não fornecido.' },
        { status: 400 },
      )
    }

    const seller = await prisma.user.findUnique({
      where: {
        id: userId,
        role: 'SELLER',
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
      return NextResponse.json(
        { error: 'Vendedor não encontrado.' },
        { status: 404 },
      )
    }

    return NextResponse.json(seller)
  } catch (error) {
    console.error(`Erro ao buscar dados do vendedor:`, error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}
