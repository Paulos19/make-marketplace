import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const categoriesWithProducts = await prisma.category.findMany({
      where: {
        products: {
          some: {
            isSold: false,
            isReserved: false,
            isService: false, // <-- FILTRO ADICIONADO AQUI
          },
        },
      },
      include: {
        products: {
          where: {
            isSold: false,
            isReserved: false,
            isService: false, // <-- FILTRO ADICIONADO AQUI TAMBÉM
          },
          include: {
            user: true,
            category: true
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })
    
    // Filtra categorias que ficaram sem produtos após a filtragem
    const filteredCategories = categoriesWithProducts.filter(
      (category) => category.products.length > 0
    )

    return NextResponse.json(filteredCategories)
  } catch (error) {
    console.error('[PRODUCTS_BY_CATEGORY_GET]', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}
