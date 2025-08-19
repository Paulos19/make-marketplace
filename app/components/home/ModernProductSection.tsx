'use client'

import { Prisma } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/app/products/components/ProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface ModernProductSectionProps {
  id: string;
  title: string
  bannerImageUrl: string
  bannerFontColor: string
  productIds: string[]
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  products: ProductWithDetails[]
}

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

export function ModernProductSection({
  title,
  bannerImageUrl,
  bannerFontColor,
  products,
  id
}: ModernProductSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi]);

  if (!products || products.length === 0) return null

  const sectionLink = `/products?section=${title.toLowerCase().replace(/ /g, '-')}`;

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.2 }}
      className="py-12"
    >
      {/* Cabeçalho da Seção */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-6"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        <Button asChild variant="ghost">
          <Link href={sectionLink}>
            Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
      
      {/* Container Principal com Efeito de Sobreposição */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Banner com Efeito de Hover */}
        <motion.div 
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="group relative h-[50vh] w-full overflow-hidden rounded-2xl shadow-2xl"
        >
          <Image
            src={bannerImageUrl}
            alt={`Banner para ${title}`}
            fill
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </motion.div>

        {/* Carrossel de Produtos "Flutuante" */}
        <div className="relative z-10 -mt-28">
           <div className="embla" ref={emblaRef}>
            <div className="embla__container -ml-4 pl-8 pr-8">
              {products.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="embla__slide basis-[65%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <div className="p-2">
                    <ProductCard
                      product={transformProductForClient(product) as any}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Controles do Carrossel */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full flex justify-between items-center px-2 pointer-events-none">
            <Button onClick={scrollPrev} variant="secondary" size="icon" className="rounded-full shadow-lg pointer-events-auto h-10 w-10">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button onClick={scrollNext} variant="secondary" size="icon" className="rounded-full shadow-lg pointer-events-auto h-10 w-10">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
