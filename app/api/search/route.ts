import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Realiza buscas em paralelo por produtos, vendedores e categorias
    const [products, sellers, categories] = await Promise.all([
      // Busca em produtos (nome, descrição)
      prisma.product.findMany({
        where: {
          isSold: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, images: true },
        take: 4,
      }),
      // Busca em vendedores (nome da loja, nome do vendedor)
      prisma.user.findMany({
        where: {
          role: UserRole.SELLER,
          showInSellersPage: true,
          OR: [
            { storeName: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, storeName: true, image: true },
        take: 3,
      }),
      // Busca em categorias
      prisma.category.findMany({
          where: {
              name: {
                  contains: query,
                  mode: 'insensitive',
              },
          },
          select: { id: true, name: true },
          take: 2,
      })
    ]);

    // Formata os resultados para um padrão consistente
    const productResults = products.map(p => ({
      type: 'product' as const,
      id: p.id,
      name: p.name,
      image: p.images?.[0] || null,
    }));

    const sellerResults = sellers.map(s => ({
      type: 'seller' as const,
      id: s.id,
      name: s.storeName || s.name || 'Vendedor Anónimo',
      image: s.image,
    }));

    const categoryResults = categories.map(c => ({
        type: 'category' as const,
        id: c.id,
        name: c.name,
        image: null, // Categorias não têm imagem, o frontend usará um ícone
    }));

    // Combina e retorna os resultados
    const combinedResults = [...sellerResults, ...categoryResults, ...productResults];

    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error('[SEARCH_API_ERROR]', error);
    return new NextResponse('Erro interno ao processar a busca.', { status: 500 });
  }
}
