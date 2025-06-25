// app/page.tsx

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rocket, ArrowRight, ShoppingBag, UserPlus } from 'lucide-react';
import { HeroCarousel } from './components/home/HeroCarousel';
import { ProductScrollArea } from './components/home/ProductScrollArea';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ModernProductSection } from './components/home/ModernProductSection';
import { CategoryHighlights } from './components/home/CategoryHighlights';
import { TopSellers } from './components/home/TopSellers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from './products/components/ProductCard';

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true };
}>;
type SectionWithProducts = Prisma.HomepageSectionGetPayload<{}> & {
  products: ProductWithDetails[];
};

const transformProductForClient = (product: ProductWithDetails) => {
    if (!product) return null;
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

export default async function HomePage() {
  const [
    banners,
    boostedProducts,
    homepageSections,
    highlightedCategories,
    topSellers,
  ] = await Promise.all([
    prisma.homePageBanner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      where: { 
        boostedUntil: { gte: new Date() }, 
        isSold: false, 
        isReserved: false,
        isService: false, // <-- FILTRO ADICIONADO AQUI
      },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 10,
    }),
    prisma.homepageSection.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.category.findMany({ where: { products: { some: { isService: false } } }, take: 5 }), // Filtro adicionado
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
  ]);

  const allProductIds = homepageSections.flatMap((section) => section.productIds);
  const sectionProducts =
    allProductIds.length > 0
      ? await prisma.product.findMany({
          where: { 
            id: { in: allProductIds },
            isService: false, // <-- FILTRO ADICIONADO AQUI
          },
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
        <div className="flex flex-col">
          <HeroCarousel banners={banners} />

          <div className="container mx-auto flex flex-col gap-12 sm:gap-16 py-12 sm:py-16">
            
            {boostedProducts.length > 0 && (
              <>
                {/* Versão Desktop */}
                <section className="hidden md:block rounded-xl bg-gradient-to-tr from-white p-1 shadow-2xl">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-6 sm:p-8">
                      <ProductScrollArea
                          title="Turbinados do Zaca"
                          products={boostedProducts}
                          icon={<Rocket className="h-6 w-6 text-blue-400" />}
                      />
                  </div>
                </section>

                {/* Versão Mobile */}
                <section className="md:hidden">
                    <div className="rounded-xl bg-gradient-to-tr from-white p-1 shadow-2xl">
                        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                            <Rocket className="h-6 w-6 text-blue-400" />
                            <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                                Turbinados do Zaca
                            </h2>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {boostedProducts.map((product) => (
                            <div key={product.id} className="w-48 flex-shrink-0">
                                <ProductCard product={transformProductForClient(product) as any} />
                            </div>
                        ))}
                    </div>
                </section>
              </>
            )}

            <CategoryHighlights categories={highlightedCategories} />
            
            {sectionsWithProducts.map((section) => (
              <ModernProductSection key={section.id} {...section} />
            ))}

            <div className="text-center">
              <Button asChild size="lg">
                <Link href="/products">
                  Ver todos os produtos <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            {topSellers.length > 0 && (
                <TopSellers sellers={topSellers} />
            )}
          </div>
          
          <section className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center">
                        <Image src="/zaca.svg" alt="Ilustração do Zaca" width={500} height={500} className="mx-auto w-full max-w-md" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-zaca-roxo dark:text-zaca-lilas leading-tight">
                            CONECTE-SE COM SETE LAGOAS
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Cadastre-se para começar a vender seus produtos ou descobrir os melhores achadinhos e serviços da cidade!
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

        </div>
      </main>
      <Footer />
    </div>
  );
}
