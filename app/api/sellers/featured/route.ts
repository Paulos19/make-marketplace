import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const featuredSellers = await prisma.user.findMany({
      where: {
        // Filtra apenas usuários que são vendedores
        role: 'SELLER',
        // Filtra apenas vendedores marcados para aparecer
        showInSellersPage: true,
        // Garante que o vendedor tenha pelo menos um produto disponível
        products: {
          some: {
            isReserved: false,
          },
        },
      },
      include: {
        products: {
          where: {
            isReserved: false,
          },
          include: {
            user: true,
            category: true,
          },
          // Limita a 10 produtos por vendedor
          take: 10,
        },
      },
    })

    return NextResponse.json(featuredSellers)
  } catch (error) {
    console.error('Erro ao buscar vendedores em destaque:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}
