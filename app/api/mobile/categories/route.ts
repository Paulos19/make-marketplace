import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar categorias mobile:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar categorias' }, { status: 500 });
  }
}
