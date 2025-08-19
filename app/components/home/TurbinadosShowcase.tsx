// app/products/components/TurbinadosShowcase.tsx

'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Rocket, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Prisma } from '@prisma/client'
import { Skeleton } from '@/components/ui/skeleton'
import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

// Tipagem local
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface TurbinadosShowcaseProps {
  products: ProductWithDetails[];
  isLoading: boolean;
}

// --- NOVO CARD PARA O CARROSSEL ---
const SpotlightCard = ({ product }: { product: ProductWithDetails }) => (
    <Link href={`/products/${product.id}`} className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-lg transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
        <div className="relative aspect-[3/4] w-full">
            <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Rocket className="h-4 w-4" /> TURBINADO
            </div>
        </div>
        <div className="flex flex-col p-4">
            <h3 className="font-bold truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground truncate">por {product.user.storeName || product.user.name}</p>
            <p className="mt-2 text-lg font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price!)}
            </p>
        </div>
    </Link>
);


// --- COMPONENTE PRINCIPAL DA VITRINE ---
export function TurbinadosShowcase({ products, isLoading }: TurbinadosShowcaseProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [progress, setProgress] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const scrollProgress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setProgress(scrollProgress * 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll();
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onScroll);
  }, [emblaApi, onScroll]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="flex gap-6">
            <Skeleton className="w-1/4 h-[400px] rounded-xl"/>
            <Skeleton className="w-1/4 h-[400px] rounded-xl"/>
            <Skeleton className="w-1/4 h-[400px] rounded-xl"/>
            <Skeleton className="w-1/4 h-[400px] rounded-xl"/>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        {/* Fundo Decorativo */}
        <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px]"></div>
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,hsl(var(--zaca-roxo)/0.2),transparent)]" />
        </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center md:flex-row md:justify-between md:text-left"
        >
          <div>
            <h2 className="text-4xl font-bangers tracking-wider text-white">
              Vitrine Turbinada
            </h2>
            <p className="mt-1 max-w-2xl text-lg text-slate-400">
              Uma seleção especial dos melhores produtos em destaque.
            </p>
          </div>
          <Button asChild variant="ghost" className="mt-4 text-white hover:bg-white/10 md:mt-0">
            <Link href="/products?sort=boosted">
              Ver todos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="embla" ref={emblaRef}>
            <motion.div 
                className="embla__container"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ staggerChildren: 0.1 }}
            >
                {products.map((product) => (
                <motion.div
                    key={product.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="embla__slide basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 p-3"
                >
                    <SpotlightCard product={product} />
                </motion.div>
                ))}
            </motion.div>
        </div>

        <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-3">
                <Button onClick={scrollPrev} variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button onClick={scrollNext} variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
            <div className="w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <motion.div 
                    className="h-2 rounded-full bg-gradient-to-r from-zaca-lilas to-zaca-roxo" 
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
      </div>
    </section>
  )
}
