import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const categoriesWithProducts = await prisma.category.findMany({
      where: {
        // Apenas categorias que têm pelo menos um produto associado
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
          // Inclui os dados do vendedor (user) e da categoria para cada produto
          include: {
            user: true,
            category: true,
          },
          // Limita a 10 produtos por categoria para não sobrecarregar a página
          take: 10,
        },
      },
    })

    return NextResponse.json(categoriesWithProducts)
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}
