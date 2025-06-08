
import { DynamicHeroBanner } from '@/app/components/home/DynamicHeroBanner';
import { CategoryFeatureSection } from '@/app/components/home/CategoryFeatureSection';
import prisma from "@/lib/prisma";
import type { Product, Category, User } from "@prisma/client";
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Tipagem enriquecida para garantir que temos todos os dados necessários
type ProductWithDetails = Product & {
  user: { name: string | null };
  categories: Category[];
};
interface CategorySectionData {
  category: Category;
  products: ProductWithDetails[];
}

// Busca os dados para as seções de categoria no servidor
async function getCategorySectionsData(): Promise<CategorySectionData[]> {
  try {
    const categoriesWithProducts = await prisma.category.findMany({
      where: { products: { some: {} } },
      include: {
        products: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            // Buscando a relação 'category' (singular)
            category: true,
          },
        },
      },
    });

    return categoriesWithProducts
      .filter(c => c.products.length > 0)
      .map(categoryData => {
        const { products, ...categoryDetails } = categoryData;
        
        // Normaliza os produtos para o formato que o frontend espera
        const normalizedProducts = products.map(p => {
          const { category, ...restOfProduct } = p as any;
          return {
            ...restOfProduct,
            categories: category ? [category] : [],
          };
        });

        return {
          category: categoryDetails,
          products: normalizedProducts as ProductWithDetails[],
        };
      });
  } catch (error) {
    console.error("Erro ao buscar dados para HomePage:", error);
    return [];
  }
}

export default async function HomePage() {
  const allSectionsData = await getCategorySectionsData();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar com fundo transparente e fixa sobre o banner */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Navbar />
      </div>
      
      <main>
        {/* Banner principal que ocupa a tela inteira (100vh) */}
        <DynamicHeroBanner />

        {/* Renderiza as seções de categoria abaixo do banner */}
        {allSectionsData.map((sectionData, index) => (
          <CategoryFeatureSection
            key={sectionData.category.id}
            category={sectionData.category}
            products={sectionData.products}
            reverseLayout={index % 2 !== 0}
          />
        ))}
      </main>

      <Footer />
    </div>
  );
}
