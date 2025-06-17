// app/api/search/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Retorna um erro se o parâmetro de busca 'q' não for fornecido
  if (!query) {
    return NextResponse.json({ error: 'O parâmetro de busca é obrigatório' }, { status: 400 });
  }

  try {
    // Busca no banco de dados por produtos cujo nome contenha o termo de busca.
    // A busca é case-insensitive e limitada a 10 resultados para performance.
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive', // Garante a busca sem diferenciar maiúsculas/minúsculas
        },
      },
      take: 10, // Limita o número de resultados retornados
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar resultados da pesquisa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
