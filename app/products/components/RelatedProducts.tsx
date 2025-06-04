"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge'; // Se for usar badges de promoção

// Interfaces (devem ser consistentes com o restante do projeto)
interface UserInfo {
  id: string;
  name?: string | null;
}
interface Product {
  id:string;
  name: string;
  price: number;
  imageUrls: string[];
  user: UserInfo; // Para exibir "Vendido por" se desejado, ou para outros links
  onPromotion?: boolean;
  originalPrice?: number | null;
  categories?: { id: string; name: string }[];
}

interface RelatedProductsProps {
  title: string;
  products: Product[];
  currentProductId?: string; // Para evitar mostrar o produto atual na lista de relacionados
}

// Card compacto para produtos relacionados (similar ao AchadinhoCardMini/CategoryProductCard)
const RelatedProductCard = ({ product }: { product: Product }) => (
  <Card className="group relative flex flex-col h-full overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-zaca-magenta dark:hover:border-zaca-magenta">
    <Link href={`/products/${product.id}`} className="block aspect-square w-full relative" aria-label={product.name}> {/* Mudado para aspect-square */}
      <Image
        src={product.imageUrls[0] || '/img-placeholder.png'}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
      />
      {product.onPromotion && (
        <div className="absolute top-1.5 right-1.5 bg-zaca-vermelho text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm shadow-md">
          OFERTA
        </div>
      )}
    </Link>
    <CardContent className="p-2.5 flex-grow flex flex-col justify-between">
      <div>
        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate group-hover:text-zaca-roxo transition-colors">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h4>
      </div>
      <div className="mt-1">
        {product.onPromotion && product.originalPrice && (
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-through mr-1">
            R${product.originalPrice.toFixed(2)}
          </span>
        )}
        <span className={`text-sm sm:text-md font-bold ${product.onPromotion ? 'text-zaca-vermelho' : 'text-slate-900 dark:text-slate-50'}`}>
          R${product.price.toFixed(2)}
        </span>
      </div>
    </CardContent>
  </Card>
);


const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function RelatedProducts({ title, products, currentProductId }: RelatedProductsProps) {
  const filteredProducts = currentProductId 
    ? products.filter(p => p.id !== currentProductId)
    : products;

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible" // Ou whileInView se preferir
      viewport={{ once: true, amount: 0.1 }}
      className="py-10 md:py-16 bg-slate-100 dark:bg-slate-900/70"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bangers text-center sm:text-left mb-6 md:mb-8 text-zaca-roxo dark:text-zaca-lilas tracking-wide">
          {title}
        </h2>
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 'auto',
            containScroll: 'trimSnaps',
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2.5 md:-ml-4">
            {filteredProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-2.5 md:pl-4 basis-1/2 xs:basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6" // Mais itens visíveis
              >
                <RelatedProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {filteredProducts.length > 4 && <CarouselPrevious className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-md" />}
          {filteredProducts.length > 4 && <CarouselNext className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-md" />}
        </Carousel>
      </div>
    </motion.section>
  );
}