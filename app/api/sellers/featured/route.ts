import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const featuredSellers = await prisma.user.findMany({
      where: {
        role: UserRole.SELLER,
        showInSellersPage: true,
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
          take: 5,
        },
      },
      take: 5,
    })

    // Filtra vendedores que ficaram sem produtos após a filtragem
    const filteredSellers = featuredSellers.filter(
      (seller) => seller.products.length > 0
    )

    return NextResponse.json(filteredSellers)
  } catch (error) {
    console.error('[FEATURED_SELLERS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
