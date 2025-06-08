// app/api/banners/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Busca todos os banners que estão ativos
export async function GET() {
  try {
    const banners = await prisma.homePageBanner.findMany({
      where: {
        isActive: true, // Garante que apenas banners ativos sejam mostrados
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
