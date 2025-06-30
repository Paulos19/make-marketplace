import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Primeiro, busca o produto principal para obter o categoryId e o userId
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        categoryId: true,
        userId: true,
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Busca produtos da mesma categoria e do mesmo vendedor em paralelo
    const [relatedProducts, moreFromSeller] = await Promise.all([
      // Produtos relacionados (mesma categoria)
      prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
          isSold: false,
          isReserved: false,
        },
        include: {
          user: {
            select: { name: true, storeName: true },
          },
        },
        take: 10,
      }),
      // Mais produtos do mesmo vendedor
      prisma.product.findMany({
        where: {
          userId: product.userId,
          id: { not: productId },
          isSold: false,
          isReserved: false,
        },
        include: {
          user: {
            select: { name: true, storeName: true },
          },
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({ relatedProducts, moreFromSeller });

  } catch (error) {
    console.error('[PRODUCT_RELATED_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}