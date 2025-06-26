import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 60;
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
