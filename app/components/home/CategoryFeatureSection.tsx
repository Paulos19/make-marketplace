'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/app/products/components/ProductCard'; // Reutilizamos o ProductCard
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, Category, User } from '@prisma/client';

// Tipo enriquecido para incluir as relações que precisamos
type ProductWithDetails = Product & {
  user: { name: string | null };
  categories: Category[];
};

interface CategoryFeatureSectionProps {
  category: Category;
  products: ProductWithDetails[];
  reverseLayout?: boolean; // Para alternar o layout (imagem à direita/esquerda)
}

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } },
};

const cardContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

export function CategoryFeatureSection({ category, products, reverseLayout = false }: CategoryFeatureSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  if (products.length === 0) {
    return null; // Não renderiza nada se não houver produtos
  }

  const featuredProduct = products[0]; // O primeiro produto será o destaque
  const otherProducts = products.slice(1, 5); // Os próximos 4 para a grelha

  return (
    <motion.section
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={sectionVariants}
      className="w-full py-16 md:py-24 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Cabeçalho da Secção */}
        <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-xl md:text-2xl font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wide">
                {category.name}
            </h2>
            <Button asChild variant="ghost">
                <Link href={`/products?category=${category.id}`} className="text-zaca-azul dark:text-zaca-lilas">
                Ver Tudo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>

        {/* Layout Principal da Secção */}
        <div className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center",
            reverseLayout && "lg:grid-flow-col-dense"
        )}>
          {/* Imagem de Destaque */}
          <motion.div
            variants={{ initial: { opacity: 0, x: reverseLayout ? 50 : -50 }, animate: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }}}
            className={cn("w-full h-[60vh] lg:h-[75vh] relative rounded-2xl overflow-hidden shadow-2xl", reverseLayout && "lg:col-start-2")}
          >
            <Image
              src={featuredProduct.images[0] || '/img-placeholder.png'}
              alt={featuredProduct.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
              <h3 className="text-2xl md:text-4xl font-bold drop-shadow-lg">{featuredProduct.name}</h3>
              <p className="mt-2 text-lg font-bold drop-shadow-lg">R$ {featuredProduct.price.toFixed(2)}</p>
              <Button asChild className="mt-4 bg-white text-black hover:bg-slate-200">
                <Link href={`/products/${featuredProduct.id}`}>
                    <ShoppingCart className="mr-2 h-4 w-4"/> Ver Achadinho
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Grelha de Outros Produtos */}
          <motion.div variants={cardContainerVariants} className="grid grid-cols-2 gap-4 md:gap-6">
            {otherProducts.map((product) => (
              <motion.div key={product.id} variants={sectionVariants}>
                 <ProductCard product={product as any} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
