import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rocket } from 'lucide-react';
import { HeroCarousel } from './components/home/HeroCarousel';
import { ProductScrollArea } from './components/home/ProductScrollArea';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ModernProductSection } from './components/home/ModernProductSection';
import { CategoryHighlights } from './components/home/CategoryHighlights';
import { TopSellers } from './components/home/TopSellers';

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
  ] = await Promise.all([
    prisma.homePageBanner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      where: { boostedUntil: { gte: new Date() }, isSold: false, isReserved: false },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 10,
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
        <div className="flex flex-col">
          <HeroCarousel banners={banners} />

          <div className="container mx-auto flex flex-col gap-12 sm:gap-16 py-12 sm:py-16">
            
            {boostedProducts.length > 0 && (
              <section className="rounded-xl bg-gradient-to-tr from-blue-900 via-slate-900 to-zaca-roxo p-1 shadow-2xl">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-6 sm:p-8">
                    <ProductScrollArea
                        title="Turbinados da Semana"
                        products={boostedProducts}
                        icon={<Rocket className="h-6 w-6 text-blue-400" />}
                    />
                </div>
              </section>
            )}

            {topSellers.length > 0 && (
                <TopSellers sellers={topSellers} />
            )}

            <CategoryHighlights categories={highlightedCategories} />
            
            {sectionsWithProducts.map((section) => (
              <ModernProductSection key={section.id} {...section} />
            ))}
            
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
