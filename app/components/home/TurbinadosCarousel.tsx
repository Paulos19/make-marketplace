'use client'

import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { ProductCard } from '@/app/products/components/ProductCard'
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="py-12 bg-muted/40 dark:bg-muted/10 border-y"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            <Rocket className="h-6 w-6 text-primary" />
            Turbinados da Semana
          </h2>
          <Button asChild variant="ghost">
            <Link href="/products?sort=boosted">
              Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="embla" ref={emblaRef}>
          <div className="embla__container -ml-4">
            {products.map((product) => (
              <div key={product.id} className="embla__slide basis-[65%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                <div className="p-2">
                  <ProductCard product={transformProductForClient(product) as any} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}