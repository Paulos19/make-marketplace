// app/page.tsx

import { DynamicHeroBanner } from '@/app/components/home/DynamicHeroBanner';
import { CategoryFeatureSection } from '@/app/components/home/CategoryFeatureSection';
import { CustomSection } from '@/app/components/home/CustomSection';
import prisma from "@/lib/prisma";
import type { Product, Category, User, HomepageSection } from "@prisma/client";
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// ==================================================================
// TIPAGENS E FUNÇÕES DE BUSCA DE DADOS (DEFINIDAS APENAS UMA VEZ)
// ==================================================================

type ProductWithDetails = Product & { user: { name: string | null }, categories: Category[] };
interface CategorySectionData { id: string, type: 'category', component: React.ReactNode, reverseLayout: boolean }
type SectionWithProducts = HomepageSection & { products: ProductWithDetails[] };
interface CustomSectionData { id: string, type: 'custom', component: React.ReactNode }

async function getCategorySectionsData(): Promise<{ category: Category; products: ProductWithDetails[] }[]> {
  try {
    const categoriesWithProducts = await prisma.category.findMany({
      where: { products: { some: {} } },
      include: {
        products: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            category: true,
          },
        },
      },
    });
    return categoriesWithProducts
      .filter(c => c.products.length > 0)
      .map(categoryData => {
        const { products, ...categoryDetails } = categoryData;
        const normalizedProducts = products.map(p => {
          const { category, ...restOfProduct } = p as any;
          return { ...restOfProduct, categories: category ? [category] : [] };
        });
        return { category: categoryDetails, products: normalizedProducts as ProductWithDetails[] };
      });
  } catch (error) {
    console.error("Erro ao buscar dados para HomePage:", error);
    return [];
  }
}

async function getHomepageSections(): Promise<SectionWithProducts[]> {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await prisma.product.findMany({
          where: { id: { in: section.productIds } },
          include: { user: { select: { name: true } }, category: true }
        });

        const orderedProducts = section.productIds.map(id => products.find(p => p.id === id)).filter(Boolean) as (Product & { user: { name: string | null }, category: Category | null })[];

        const normalizedProducts = orderedProducts.map(p => {
          const { category, ...rest } = p;
          return { ...rest, categories: category ? [category] : [] };
        });

        return { ...section, products: normalizedProducts as ProductWithDetails[] };
      })
    );
    return sectionsWithProducts;
  } catch (error) {
    console.error("Erro ao buscar seções customizadas da homepage:", error);
    return [];
  }
}

// ==================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ==================================================================

export default async function HomePage() {
  const [customSections, categorySections] = await Promise.all([
    getHomepageSections(),
    getCategorySectionsData()
  ]);

  const combinedSections: (CustomSectionData | CategorySectionData)[] = [];

  const customSectionsByOrder = new Map<number, CustomSectionData[]>();
  customSections.forEach(section => {
    const order = section.order;
    if (!customSectionsByOrder.has(order)) {
      customSectionsByOrder.set(order, []);
    }
    customSectionsByOrder.get(order)?.push({
      id: section.id,
      type: 'custom',
      component: <CustomSection section={section} />
    });
  });

  if (customSectionsByOrder.has(0)) {
    combinedSections.push(...customSectionsByOrder.get(0)!);
  }

  categorySections.forEach((categoryData, index) => {
    combinedSections.push({
      id: categoryData.category.id,
      type: 'category',
      component: <CategoryFeatureSection category={categoryData.category} products={categoryData.products} reverseLayout={index % 2 !== 0} />,
      reverseLayout: index % 2 !== 0
    });

    const orderForThisPosition = index + 1;
    if (customSectionsByOrder.has(orderForThisPosition)) {
      combinedSections.push(...customSectionsByOrder.get(orderForThisPosition)!);
    }
  });

  Array.from(customSectionsByOrder.keys()).sort((a, b) => a - b).forEach(order => {
    if (order > categorySections.length) {
      combinedSections.push(...customSectionsByOrder.get(order)!);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-0 left-0 right-0 z-20">
        <Navbar />
      </div>

      <main>
        <DynamicHeroBanner />

        <div className="flex flex-col gap-20 md:gap-24 py-48 md:py-40">
          {combinedSections.map((section) => (
            <div key={`${section.type}-${section.id}`}>
              {section.component}
            </div>
          ))}
        </div>
      </main>

        <Footer />
    </div>
  );
}
