import Link from 'next/link';
// CORREÇÃO: Importa o tipo 'Product' personalizado que inclui as relações
import { Product } from '@/lib/types';
import { Category } from '@prisma/client';
import { ProductCard } from '@/app/products/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ModernProductSectionProps {
  category: Category;
  // CORREÇÃO: Usa o tipo 'Product' correto
  products: Product[];
}

/**
 * A modern section to display products with a hero product and a grid of others.
 * Features a clean title and a "See All" link.
 */
export function ModernProductSection({ category, products }: ModernProductSectionProps) {
  // Se não houver produtos, a seção não é renderizada.
  if (products.length === 0) {
    return null;
  }

  // O primeiro produto é destacado.
  const heroProduct = products[0];
  // Os próximos 4 produtos são exibidos em um grid.
  const otherProducts = products.slice(1, 5);

  return (
    <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da Seção */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
            {category.name}
          </h2>
          <Button variant="ghost" asChild>
            <Link href={`/products?category=${category.id}`} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Layout Principal (Grid Assimétrico) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 items-start">
          
          {/* Produto de Destaque (Lado Esquerdo) */}
          <div className="mb-8 lg:mb-0 transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <ProductCard product={heroProduct} />
          </div>

          {/* Grid de Outros Produtos (Lado Direito) */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {otherProducts.map((product) => (
              <div key={product.id} className="transform hover:scale-105 transition-transform duration-300 ease-in-out">
                 <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
