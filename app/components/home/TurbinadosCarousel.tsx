'use client'

import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { MiniProductCard } from '@/app/components/product/MiniProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

export function TurbinadosCarousel({ products }: { products: ProductWithDetails[] }) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <h2 className="flex items-center gap-3 text-3xl md:text-4xl font-black tracking-tight text-foreground">
            <div className="bg-zaca-roxo/10 dark:bg-zaca-roxo/20 p-2 rounded-xl">
                <Rocket className="h-8 w-8 text-zaca-roxo" />
            </div>
            Turbinados da Semana
          </h2>
          <Button asChild variant="outline" className="rounded-full font-bold shadow-sm hover:scale-105 transition-transform">
            <Link href="/products?sort=boosted">
              Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex -ml-4 py-4">
            {products.map((product) => (
              <div key={product.id} className="embla__slide pl-4 flex-none w-[70%] sm:w-[45%] md:w-[30%] lg:w-[22%] xl:w-[18%]">
                <div className="h-[380px] w-full">
                  <MiniProductCard product={transformProductForClient(product) as any} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}