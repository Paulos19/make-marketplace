// app/page.tsx

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ShoppingBag, UserPlus } from 'lucide-react';
import { HeroCarousel } from './components/home/HeroCarousel';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ModernProductSection } from './components/home/ModernProductSection';
import { CategoryHighlights } from './components/home/CategoryHighlights';
import { TopSellers } from './components/home/TopSellers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import SupportSection from './components/home/SupportSection';
import { TurbinadosCarousel } from './components/home/TurbinadosCarousel';
import { TitledProductGrid } from './components/home/TitledProductGrid';


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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow">
        <HeroCarousel banners={banners} />

        {/* --- 1. Seção de Turbinados (redesenhada e mais sutil) --- */}
        {boostedProducts.length > 0 && <TurbinadosCarousel products={boostedProducts} />}

        <div className="container mx-auto flex flex-col gap-16 sm:gap-24 py-16 sm:py-24">
          
          {/* --- 2. Seção dedicada para Novos Produtos --- */}
          {newProducts.length > 0 && (
            <TitledProductGrid 
              title="Novos Achadinhos"
              products={newProducts}
              viewAllLink="/products?sort=newest"
            />
          )}

          {/* --- 3. Seção dedicada para Novos Serviços --- */}
          {newServices.length > 0 && (
            <TitledProductGrid 
              title="Serviços em Destaque"
              products={newServices}
              viewAllLink="/services?sort=newest"
            />
          )}

          {/* 4. Destaques de Categoria */}
          <CategoryHighlights categories={highlightedCategories} />
          
          {/* 5. Seções Customizadas (criadas pelo admin) */}
          {sectionsWithProducts.map((section) => (
            <ModernProductSection key={section.id} {...section} />
          ))}

          {/* 6. Top Vendedores */}
          {topSellers.length > 0 && <TopSellers sellers={topSellers} />}

        </div>
        
        {/* 7. Seção de CTA e Suporte */}
        <section className="bg-white dark:bg-slate-900 flex items-center justify-center py-20">
          <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="text-center">
                      <Image src="/zaca.svg" alt="Ilustração do Zaca" width={500} height={500} className="mx-auto w-full max-w-sm" />
                  </div>
                  <div className="text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-extrabold text-zaca-roxo dark:text-zaca-lilas leading-tight">
                          CONECTE-SE COM SETE LAGOAS
                      </h2>
                      <p className="mt-4 text-lg text-muted-foreground">
                          Cadastre-se para começar a vender ou descobrir os melhores achadinhos e serviços da cidade!
                      </p>
                      <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                          <Button asChild size="lg" className="bg-zaca-magenta hover:bg-zaca-magenta/90 text-white shadow-lg">
                              <Link href="/auth/signup">
                                  <UserPlus className="mr-2 h-5 w-5" />
                                  QUERO VENDER
                              </Link>
                          </Button>
                          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-lg">
                              <Link href="/products">
                                  <ShoppingBag className="mr-2 h-5 w-5" />
                                  QUERO COMPRAR
                              </Link>
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
        </section>
        <SupportSection />
      </main>
      <Footer />
    </div>
  );
}