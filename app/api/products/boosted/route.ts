import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define que os dados desta rota podem ser cacheados por até 60 segundos.
// A revalidação instantânea após uma compra é feita pelo webhook.
export const revalidate = 60; 

/**
 * GET: Busca todos os produtos que estão atualmente impulsionados.
 */
export async function GET() {
  try {
    const boostedProducts = await prisma.product.findMany({
      where: {
        boostedUntil: {
          gte: new Date(),
        },
        isSold: false,
        isReserved: false,
      },
      include: {
        user: { 
          select: { id: true, name: true, image: true, whatsappLink: true, storeName: true },
        },
        category: true,
      },
      orderBy: {
        boostedUntil: 'asc',
      },
      take: 10,
    });

    return NextResponse.json(boostedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos turbinados:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar produtos em destaque.' }, { status: 500 });
  }
}
