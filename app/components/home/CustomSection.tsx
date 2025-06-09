// app/components/home/CustomSection.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ProductCard } from '@/app/products/components/ProductCard';
import type { HomepageSection, Product, User, Category } from '@prisma/client';
import './CustomSection.css'; 

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
    // O container da seção continua com altura total e como referência de posicionamento
    <section className="relative w-full h-screen snap-start">
      {/* Container do Banner (70% da altura) */}
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
      
      {/* <<< INÍCIO DA CORREÇÃO >>> */}
      {/* Container dos Produtos - Posicionado absolutamente para "flutuar" */}
      <div 
        // Posiciona o topo do container exatamente onde o banner de 70vh termina.
        // O 'transform' puxa o container para cima pela metade de sua altura,
        // fazendo com que ele fique perfeitamente centralizado na linha divisória.
        className="absolute top-[80vh] left-0 right-0 z-10 transform -translate-y-1/2"
      >
        <div className="container mx-auto px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ staggerChildren: 0.1 }}
              // As classes para o scroll horizontal continuam as mesmas
              className="flex flex-nowrap gap-4 overflow-x-auto horizontal-scroll-container py-4"
            >
              {section.products.map((product) => (
                <motion.div 
                  key={product.id} 
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}
                  // A largura dos cards é ajustada para o layout de scroll
                  className="flex-shrink-0 w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5"
                >
                  <ProductCard product={product as any} />
                </motion.div>
              ))}
            </motion.div>
        </div>
      </div>
      {/* <<< FIM DA CORREÇÃO >>> */}
    </section>
  );
}
