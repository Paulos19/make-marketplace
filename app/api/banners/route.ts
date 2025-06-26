import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.homePageBanner.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Erro ao buscar banners:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar banners' }, { status: 500 });
  }
}
