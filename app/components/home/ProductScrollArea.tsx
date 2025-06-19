"use client"

import { useRef, useState, useEffect, useCallback } from 'react'
import { ProductCard } from '@/app/products/components/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Tipo para os produtos, incluindo relações com usuário e categoria
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface ProductScrollAreaProps {
  products: ProductWithDetails[]
}

// Função auxiliar para transformar os dados do produto para o formato que o ProductCard espera
const transformProductForClient = (product: ProductWithDetails) => {
  return {
    ...product,
    categories: product.category ? [product.category] : [],
    createdAt: new Date(product.createdAt).toISOString(),
    updatedAt: new Date(product.updatedAt).toISOString(),
  }
}

export function ProductScrollArea({ products }: ProductScrollAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Função para verificar se a rolagem é possível e atualizar a barra de progresso
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth
      const currentScroll = el.scrollLeft
      const maxScroll = el.scrollWidth - el.clientWidth

      setCanScrollLeft(currentScroll > 5)
      setCanScrollRight(hasOverflow && currentScroll < maxScroll - 5)
      
      const progress = maxScroll > 0 ? (currentScroll / maxScroll) * 100 : 0
      setScrollProgress(progress)
    }
  }, [])

  // Efeito para adicionar e remover listeners de scroll e resize
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

  // Função para rolar o container ao clicar nas setas
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (el) {
      const scrollAmount = el.clientWidth * 0.8
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    // CORRIGIDO: O padding inferior foi movido para este contêiner pai no modo desktop.
    <div className="relative md:pb-12">
      {/* Container de Rolagem */}
      <div
        ref={scrollContainerRef}
        // O padding extra no desktop foi removido daqui
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-48 flex-shrink-0 md:w-56"
          >
            <ProductCard product={transformProductForClient(product)} />
          </div>
        ))}
      </div>

      {/* Barra de Navegação Customizada para Desktop */}
      <div className="absolute bottom-0 left-0 right-0 hidden h-5 items-center justify-center md:flex">
         <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
                "h-7 w-7 rounded-full shrink-0 transition-opacity",
                !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
         >
            <ChevronLeft className="h-5 w-5" />
         </Button>

         <div className="mx-4 h-1 flex-grow max-w-xs rounded-full bg-slate-200 dark:bg-slate-700">
            <div 
                className="h-1 rounded-full bg-slate-500 dark:bg-slate-400 transition-all duration-200"
                // A barra de progresso agora se move dentro da barra de fundo
                style={{ transform: `translateX(${scrollProgress}%)`, width: '20%' }}
            />
         </div>
        
        <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
                "h-7 w-7 rounded-full shrink-0 transition-opacity",
                !canScrollRight && "opacity-30 cursor-not-allowed"
            )}
         >
            <ChevronRight className="h-5 w-5" />
         </Button>
      </div>
    </div>
  )
}
