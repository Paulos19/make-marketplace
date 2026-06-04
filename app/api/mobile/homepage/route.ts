import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';

    // Build location filter
    const locationFilter = state ? {
      user: {
        state: { equals: state, mode: 'insensitive' as const },
        ...(city ? { city: { equals: city, mode: 'insensitive' as const } } : {}),
      }
    } : {};

    const sellerLocationFilter = state ? {
      state: { equals: state, mode: 'insensitive' as const },
      ...(city ? { city: { equals: city, mode: 'insensitive' as const } } : {}),
    } : {};

    // Fetch in parallel
    const [
      banners,
      boostedProducts,
      homepageSections,
      sellers,
      categories,
    ] = await Promise.all([
      // 1. Banners
      prisma.homePageBanner.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),

      // 2. Boosted/Turbo Products
      prisma.product.findMany({
        where: {
          boostedUntil: { gte: new Date() },
          isSold: false,
          isReserved: false,
          isService: false,
          ...locationFilter,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              storeName: true,
              image: true,
            }
          },
          category: true,
        },
        orderBy: { boostedUntil: 'asc' },
        take: 10,
      }),

      // 3. Homepage Sections
      prisma.homepageSection.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),

      // 4. Featured Sellers
      prisma.user.findMany({
        where: {
          role: 'SELLER',
          showInSellersPage: true,
          ...sellerLocationFilter,
        },
        select: {
          id: true,
          name: true,
          storeName: true,
          image: true,
        },
        take: 8,
      }),

      // 5. Categories
      prisma.category.findMany({
        where: {
          products: {
            some: {
              isSold: false,
              isReserved: false,
              ...locationFilter,
            }
          }
        },
        take: 6,
      }),
    ]);

    // Fetch products belonging to homepageSections
    const allProductIds = homepageSections.flatMap((section) => section.productIds);
    const sectionProducts = allProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: { in: allProductIds },
            isSold: false,
            isReserved: false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                storeName: true,
                image: true,
              }
            },
            category: true,
          },
        })
      : [];

    const productsMap = new Map(sectionProducts.map((p) => [p.id, p]));
    const sectionsWithProducts = homepageSections.map((section) => ({
      id: section.id,
      title: section.title,
      bannerImageUrl: section.bannerImageUrl,
      bannerFontColor: section.bannerFontColor,
      order: section.order,
      isActive: section.isActive,
      products: section.productIds
        .map((id) => productsMap.get(id))
        .filter((p): p is typeof sectionProducts[0] => !!p),
    })).filter(section => section.products.length > 0); // Only return sections that have matching products in this region

    // Categories with products for day discoveries list
    const discoveries = await prisma.product.findMany({
      where: {
        isSold: false,
        isReserved: false,
        ...locationFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            storeName: true,
            image: true,
          }
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      banners,
      boostedProducts,
      sections: sectionsWithProducts,
      sellers,
      categories,
      discoveries,
    });
  } catch (error: any) {
    console.error('Erro ao buscar dados consolidados da homepage:', error);
    return NextResponse.json({ error: 'Erro interno ao processar dados da página inicial.' }, { status: 500 });
  }
}
