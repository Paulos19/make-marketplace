'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Category } from '@prisma/client'
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface AdvancedFiltersSidebarProps {
  categories: Category[]
  hideCategoryFilter?: boolean
}

const priceRanges = [
  { label: 'Todos os Preços', min: '', max: '' },
  { label: 'Até R$ 50', min: '0', max: '50' },
  { label: 'R$ 50 - R$ 150', min: '50', max: '150' },
  { label: 'R$ 150 - R$ 500', min: '150', max: '500' },
  { label: 'Acima de R$ 500', min: '500', max: '' },
]

const sortOptions = [
  { label: 'Mais Recentes', value: 'newest' },
  { label: 'Maior Preço', value: 'price_desc' },
  { label: 'Menor Preço', value: 'price_asc' },
]

export function AdvancedFiltersSidebar({ categories, hideCategoryFilter = false }: AdvancedFiltersSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentSort = searchParams.get('sort') || 'newest'

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePriceRangeChange = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (min) params.set('minPrice', min)
    else params.delete('minPrice')
    
    if (max) params.set('maxPrice', max)
    else params.delete('maxPrice')
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const isPriceActive = (min: string, max: string) => {
    return currentMinPrice === min && currentMaxPrice === max;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-shadow font-bold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros Avançados
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:w-[400px] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 border-r border-border">
        <SheetHeader className="mb-8 border-b border-border pb-4 px-0">
          <SheetTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Filtros
          </SheetTitle>
        </SheetHeader>

        {/* Ordenar */}
        <div className="mb-8">
          <h4 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Ordenar por</h4>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilters('sort', option.value)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex justify-between items-center",
                  currentSort === option.value
                    ? "bg-foreground text-background shadow-md"
                    : "bg-white dark:bg-slate-800 border border-border/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
                {currentSort === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Categorias (Vertical) */}
        {!hideCategoryFilter && (
          <div className="mb-8">
            <h4 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Categorias</h4>
            <div className="space-y-1 bg-white dark:bg-slate-800 rounded-xl border border-border/50 p-2">
              <button
                onClick={() => updateFilters('category', '')}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors",
                  !currentCategory ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground"
                )}
              >
                Todas as Categorias
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilters('category', cat.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors",
                    currentCategory === cat.id ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preço */}
        <div className="mb-8">
          <h4 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Faixa de Preço</h4>
          <div className="space-y-3 bg-white dark:bg-slate-800 rounded-xl border border-border/50 p-4">
            {priceRanges.map((range, idx) => (
              <button
                key={idx}
                onClick={() => handlePriceRangeChange(range.min, range.max)}
                className="flex items-center gap-3 w-full group"
              >
                <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isPriceActive(range.min, range.max) 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground/30 group-hover:border-primary/50"
                )}>
                    {isPriceActive(range.min, range.max) && <div className="w-2 h-2 bg-background rounded-full"></div>}
                </div>
                <span className={cn(
                    "text-sm transition-colors",
                    isPriceActive(range.min, range.max) ? "font-bold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {range.label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </SheetContent>
    </Sheet>
  )
}
