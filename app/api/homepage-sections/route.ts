// app/api/homepage-sections/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Busca todas as seções ativas, ordenadas pelo campo 'order'
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // 2. Para cada seção, busca os detalhes completos dos produtos selecionados
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await prisma.product.findMany({
          where: {
            id: {
              in: section.productIds,
            },
          },
          include: {
            user: {
              select: { name: true },
            },
            category: true, // Inclui a categoria singular
          },
        });

        // Garante que os produtos sejam retornados na mesma ordem em que foram salvos
        const orderedProducts = section.productIds.map(id => 
            products.find(p => p.id === id)
        ).filter(p => p !== undefined); // Filtra caso algum produto tenha sido deletado

        // Normaliza os dados do produto para o formato esperado pelo ProductCard
        const normalizedProducts = orderedProducts.map(p => {
          if (!p) return null;
          const { category, ...rest } = p;
          return {
            ...rest,
            categories: category ? [category] : [],
          };
        }).filter(Boolean);


        return {
          ...section,
          products: normalizedProducts, // Adiciona o array de produtos populado à seção
        };
      })
    );

    return NextResponse.json(sectionsWithProducts);
  } catch (error) {
    console.error("Erro ao buscar seções para a homepage:", error);
    return NextResponse.json({ message: 'Erro interno ao carregar seções' }, { status: 500 });
  }
}