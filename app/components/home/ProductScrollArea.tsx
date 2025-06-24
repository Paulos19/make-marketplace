"use client"

import { useRef, useState, useEffect, useCallback } from 'react'
import { ProductCard } from '@/app/products/components/ProductCard'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface ProductScrollAreaProps {
  products: ProductWithDetails[];
  title: string;
  href?: string;
  icon?: React.ReactNode; // <<< PROPRIEDADE DO ÍCONE ADICIONADA
}

const transformProductForClient = (product: ProductWithDetails) => {
  return {
    ...product,
    categories: product.category ? [product.category] : [],
    createdAt: new Date(product.createdAt).toISOString(),
    updatedAt: new Date(product.updatedAt).toISOString(),
  }
}

export function ProductScrollArea({ products, title, href, icon }: ProductScrollAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth
      const currentScroll = el.scrollLeft
      const maxScroll = el.scrollWidth - el.clientWidth
      setCanScrollLeft(currentScroll > 5)
      setCanScrollRight(hasOverflow && currentScroll < maxScroll - 5)
    }
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (el) {
      const timer = setTimeout(handleScroll, 100)
      window.addEventListener('resize', handleScroll)
      el.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleScroll)
        el.removeEventListener('scroll', handleScroll)
      }
    }
  }, [products, handleScroll])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (el) {
      const scrollAmount = el.clientWidth * 0.8
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                {icon} {/* <<< ÍCONE RENDERIZADO AQUI */}
                <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                    {title}
                </h2>
            </div>
            {href && (
                <Button variant="ghost" asChild>
                    <Link href={href} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        Ver todos
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            )}
        </div>

        <div className="relative">
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
            >
                {products.map((product) => (
                    <div key={product.id} className="w-48 flex-shrink-0 md:w-56">
                        <ProductCard product={transformProductForClient(product) as any} />
                    </div>
                ))}
            </div>

            {/* Setas de navegação para Desktop */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center">
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className={cn("h-8 w-8 rounded-full transition-opacity", !canScrollLeft && "opacity-30 cursor-not-allowed")}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className={cn("h-8 w-8 rounded-full transition-opacity", !canScrollRight && "opacity-30 cursor-not-allowed")}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    </section>
  )
}
