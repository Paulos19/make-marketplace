import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rocket, Sparkles } from 'lucide-react';
import { HeroCarousel } from './components/home/HeroCarousel';
import { ProductScrollArea } from './components/home/ProductScrollArea';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ModernProductSection } from './components/home/ModernProductSection';
import { CategoryHighlights } from './components/home/CategoryHighlights';

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
    latestProducts,
    homepageSections,
    highlightedCategories,
  ] = await Promise.all([
    // Banners gerenciados pelo admin
    prisma.homePageBanner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    // Produtos com o plano "Achadinho Turbo"
    prisma.product.findMany({
      where: { boostedUntil: { gte: new Date() }, isSold: false, isReserved: false },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 10,
    }),
    // Últimos produtos adicionados
    prisma.product.findMany({
        where: { isSold: false, isReserved: false },
        include: { user: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
    }),
    // Seções customizadas pelo admin
    prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    // Categorias para a nova seção de destaques
    prisma.category.findMany({
        where: { products: { some: {} } }, // Apenas categorias que têm produtos
        take: 6,
    })
  ]);

  // Monta as seções dinâmicas com seus respectivos produtos
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
            
            {/* Seção de Produtos Turbinados */}
            {boostedProducts.length > 0 && (
              <ProductScrollArea
                title="Turbinados da Semana"
                products={boostedProducts}
                icon={<Rocket className="h-6 w-6 text-blue-500" />}
              />
            )}
            
            {/* Nova Seção de Categorias em Destaque */}
            <CategoryHighlights categories={highlightedCategories} />
            
            {/* Seção de Últimos Achadinhos */}
            {latestProducts.length > 0 && (
                <ProductScrollArea
                    title="Últimos Achadinhos"
                    products={latestProducts}
                    href="/products"
                    icon={<Sparkles className="h-6 w-6 text-amber-500"/>}
                />
            )}

            {/* Seções Dinâmicas criadas pelo Admin */}
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
