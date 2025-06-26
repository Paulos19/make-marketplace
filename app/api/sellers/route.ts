import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const sellers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        storeName: true,
        whatsappLink: true,
        sellerBannerImageUrl: true,
        profileDescription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('[API_SELLERS_GET]', error);
    return new NextResponse('Erro interno do servidor ao buscar vendedores', { status: 500 });
  }
}