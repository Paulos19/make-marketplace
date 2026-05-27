// app/page.tsx

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ShoppingBag, UserPlus } from 'lucide-react';
import { HeroCarousel } from '@/app/components/home/HeroCarousel';
import { EditorialProductSection } from '@/app/components/home/EditorialProductSection';
import { ModernProductSection } from '@/app/components/home/ModernProductSection';
import { CategoryHighlights } from '@/app/components/home/CategoryHighlights';
import { TopSellers } from '@/app/components/home/TopSellers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import SupportSection from '@/app/components/home/SupportSection';
import { TurbinadosCarousel } from '@/app/components/home/TurbinadosCarousel';
import { HomeCtaSection } from '@/app/components/home/HomeCtaSection';

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true };
}>;

type SectionWithProducts = Prisma.HomepageSectionGetPayload<{}> & {
  products: ProductWithDetails[];
};


export default async function HomePage() {
  const [
    banners,
    boostedProducts,
    homepageSections,
    highlightedCategories,
    topSellers,
    newProducts,
    newServices,
  ] = await Promise.all([
    prisma.homePageBanner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      where: {
        boostedUntil: { gte: new Date() },
        isSold: false,
        isReserved: false,
      },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 12,
    }),
    prisma.homepageSection.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.category.findMany({ where: { products: { some: {} } }, take: 5 }),
    (async () => {
      const sellers = await prisma.user.findMany({
        where: {
          role: 'SELLER',
          showInSellersPage: true,
          reviewsReceived: { some: {} },
        },
        include: { reviewsReceived: { select: { rating: true } } },
      });

      return sellers
        .map(seller => {
          const totalReviews = seller.reviewsReceived.length;
          if (totalReviews === 0) return { ...seller, averageRating: 0, totalReviews: 0 };
          const totalRating = seller.reviewsReceived.reduce((acc, review) => acc + review.rating, 0);
          const averageRating = totalRating / totalReviews;
          return {
            id: seller.id,
            name: seller.name,
            storeName: seller.storeName,
            image: seller.image,
            averageRating,
            totalReviews,
          };
        })
        .filter(seller => seller.averageRating >= 4.5)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);
    })(),
    prisma.product.findMany({
      where: { isService: false, isSold: false, isReserved: false },
      include: { user: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isService: true, isSold: false, isReserved: false },
      include: { user: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const allProductIds = homepageSections.flatMap((section) => section.productIds);
  const sectionProducts =
    allProductIds.length > 0
      ? await prisma.product.findMany({
        where: { id: { in: allProductIds } },
        include: { user: true, category: true },
      })
      : [];
  const productsMap = new Map(sectionProducts.map((p) => [p.id, p]));
  const sectionsWithProducts: SectionWithProducts[] = homepageSections.map((section) => ({
    ...section,
    products: section.productIds
      .map((id) => productsMap.get(id))
      .filter((p): p is ProductWithDetails => !!p),
  }));

  return (
    <>
      <HeroCarousel banners={banners} />

      {/* Turbinados da Semana - Agora com o mesmo formato Editorial (fundo colorido randômico + destaque + grid) */}
      {boostedProducts.length > 0 && (
        <EditorialProductSection
          title="Turbinados da Semana"
          products={boostedProducts}
          viewAllLink="/products?sort=boosted"
          isTurbinado={true}
        />
      )}

      <div className="container mx-auto flex flex-col gap-16 sm:gap-24 py-16 sm:py-24">

        {/* 4. Destaques de Categoria */}
        <CategoryHighlights categories={highlightedCategories} />

      </div>

      {/* --- 2. Seção dedicada para Novos Produtos --- */}
      {newProducts.length > 0 && (
        <EditorialProductSection
          title="Novos Achadinhos"
          products={newProducts}
          viewAllLink="/products?sort=newest"
        />
      )}

      {/* --- 3. Seção dedicada para Novos Serviços --- */}
      {newServices.length > 0 && (
        <EditorialProductSection
          title="Serviços em Destaque"
          products={newServices}
          viewAllLink="/services?sort=newest"
        />
      )}

      {/* 5. Seções Customizadas Netflix-style (criadas pelo admin) — Full Width */}
      {sectionsWithProducts.map((section) => (
        <ModernProductSection key={section.id} {...section} />
      ))}
      {/* 6. Top Vendedores */}
      {topSellers.length > 0 && (
        <div className="container mx-auto py-12 sm:py-16">
          <TopSellers sellers={topSellers} />
        </div>
      )}

      {/* 7. Seção de CTA e Suporte */}
      <HomeCtaSection />
      <SupportSection />
    </>
  );
}