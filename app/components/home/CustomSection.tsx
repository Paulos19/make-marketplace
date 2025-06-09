// app/components/home/CustomSection.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ProductCard } from '@/app/products/components/ProductCard';
import type { HomepageSection, Product, User, Category } from '@prisma/client';

type ProductWithDetails = Product & {
  user: Partial<User>;
  categories: Category[];
};

type SectionWithProducts = HomepageSection & {
  products: ProductWithDetails[];
};

interface CustomSectionProps {
  section: SectionWithProducts;
}

export function CustomSection({ section }: CustomSectionProps) {
  const bannerTextStyle = {
    color: section.bannerFontColor || '#FFFFFF',
  };

  return (
    <section className="relative w-full h-screen snap-start">
      {/* Banner - 70% da altura (inalterado) */}
      <div className="relative h-[70vh] w-full">
        <Image src={section.bannerImageUrl} alt={section.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full items-center justify-center p-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-4xl md:text-6xl text-center font-bangers tracking-wider filter drop-shadow-lg"
            style={bannerTextStyle}
          >
            {section.title}
          </motion.h2>
        </div>
      </div>
      
      {/* <<< ALTERAÇÃO AQUI >>> */}
      {/* Cards de Produtos - 30% da altura, com mais espaçamento interno */}
      <div className="h-[30vh] w-full bg-slate-100 dark:bg-slate-900 flex items-center px-4 py-8 md:px-8 md:py-12">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4"
          >
            {section.products.map((product) => (
              <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}>
                <ProductCard product={product as any} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}