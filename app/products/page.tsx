"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { ChevronRight, ChevronLeft, PackageOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import AchadinhosDoZacaBanner from '../components/AchadinhosDoZacaBanner'
import { ProductCard, ProductCardSkeleton } from './components/ProductCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Tipagens para garantir que os dados incluam as relações necessárias
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>
type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: { products: { include: { user: true; category: true } } }
}>
type SellerWithProducts = Prisma.UserGetPayload<{
  include: { products: { include: { user: true; category: true } } }
}>

// --- Função Auxiliar para transformar dados do produto para o cliente ---
const transformProductForClient = (product: ProductWithDetails) => {
  return {
    ...product,
    categories: product.category ? [product.category] : [],
    createdAt: new Date(product.createdAt).toISOString(),
    updatedAt: new Date(product.updatedAt).toISOString(),
  }
}

// --- Componente de Scroll de Produtos (com navegação por setas no desktop) ---
const ProductScrollArea = ({ products }: { products: ProductWithDetails[] }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
  
    const handleScroll = useCallback(() => {
      const el = scrollContainerRef.current
      if (el) {
        const hasOverflow = el.scrollWidth > el.clientWidth
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth)
      }
    }, [])
  
    useEffect(() => {
      const el = scrollContainerRef.current
      if (el) {
        handleScroll()
        el.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', handleScroll)
        return () => {
          el.removeEventListener('scroll', handleScroll)
          window.removeEventListener('resize', handleScroll)
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
  
    return (
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
        >
          {products.map((product) => (
            <div key={product.id} className="w-48 flex-shrink-0 md:w-56">
              <ProductCard product={transformProductForClient(product)} />
            </div>
          ))}
        </div>
        {canScrollLeft || canScrollRight ? (
          <div className="mt-4 hidden items-center justify-center md:flex">
            <Button variant="ghost" size="icon" onClick={() => scroll('left')} disabled={!canScrollLeft}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="w-24 h-1 mx-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <Button variant="ghost" size="icon" onClick={() => scroll('right')} disabled={!canScrollRight}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
      </div>
    )
}

// --- Componentes de Seção ---
const CategorySection = ({ category }: { category: CategoryWithProducts }) => (
  <section className="container mx-auto">
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{category.name}</h2>
        <p className="text-md text-muted-foreground">Os produtos mais recentes desta coleção.</p>
      </div>
      <Link href={`/products?category=${category.id}`} className="hidden items-center text-sm font-semibold text-primary hover:underline sm:flex">
        Ver todos
        <ChevronRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
    <ProductScrollArea products={category.products} />
  </section>
)

const SellerSection = ({ seller }: { seller: SellerWithProducts }) => {
  const isStoreAvailable = seller.showInSellersPage;

  const SellerAvatar = () => (
    <Avatar className={cn(
        "h-14 w-14 border-2", 
        isStoreAvailable ? "border-primary/50 transition-transform duration-300 group-hover:scale-110" : "border-gray-300 dark:border-gray-700"
    )}>
        <AvatarImage src={seller.image || undefined} alt={seller.name || 'Vendedor'} />
        <AvatarFallback>{seller.storeName?.charAt(0) || seller.name?.charAt(0) || 'V'}</AvatarFallback>
    </Avatar>
  )

  return (
    <section className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 group">
            {isStoreAvailable ? (
                <Link href={`/seller/${seller.id}`} aria-label={`Visitar loja de ${seller.storeName || seller.name}`}>
                    <SellerAvatar />
                </Link>
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="cursor-not-allowed"><SellerAvatar /></div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Loja não disponível</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{seller.storeName || seller.name}</h2>
            <p className="text-md text-muted-foreground">Confira as novidades deste vendedor.</p>
          </div>
        </div>
        {isStoreAvailable && (
            <Link href={`/seller/${seller.id}`} className="hidden items-center text-sm font-semibold text-primary hover:underline sm:flex">
                Ver loja
                <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
        )}
      </div>
      <ProductScrollArea products={seller.products} />
    </section>
  )
}

const FeaturedCategorySection = ({ category, orientation = 'left' }: { category: CategoryWithProducts; orientation?: 'left' | 'right' }) => {
  const [featuredProduct, ...otherProducts] = category.products
  const bannerImage = featuredProduct?.images[0] || '/img-placeholder.png'

  return (
    <div className="container mx-auto grid min-h-screen grid-cols-1 items-center gap-6 md:grid-cols-10">
      <div className={cn('relative col-span-10 h-96 rounded-xl bg-cover bg-center shadow-lg md:col-span-6 md:h-[80vh]', orientation === 'right' && 'md:order-last')}>
        <Image src={bannerImage} alt={`Banner para a categoria ${category.name}`} fill className="rounded-xl object-cover" />
      </div>
      <div className="col-span-10 flex flex-col justify-center gap-6 md:col-span-4">
        <div className="mb-2 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{category.name}</h2>
          <p className="mt-2 text-lg text-muted-foreground">Descubra os melhores achados nesta coleção.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {otherProducts.slice(0, 2).map((product) => (
            <ProductCard key={product.id} product={transformProductForClient(product)} />
          ))}
        </div>
        <div className="mt-4 text-center md:text-left">
          <Button asChild><Link href={`/products?category=${category.id}`}>Ver Coleção Completa</Link></Button>
        </div>
      </div>
    </div>
  )
}

// --- Componente Principal da Página ---
export default function ProductsPage() {
  const [bannerProducts, setBannerProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [bannerRes, categoriesRes, sellersRes] = await Promise.all([
          fetch(`/api/products?limit=5&sort=createdAt:desc`),
          fetch(`/api/products/by-category`),
          fetch(`/api/sellers/featured`),
        ])
        if (!bannerRes.ok || !categoriesRes.ok || !sellersRes.ok) throw new Error('Falha ao buscar os dados da página.')
        const bannerData = await bannerRes.json()
        const categoriesData = await categoriesRes.json()
        const sellersData = await sellersRes.json()
        setBannerProducts(bannerData)
        setCategories(categoriesData)
        setSellers(sellersData)
      } catch (error) {
        console.error("Erro ao carregar dados da página de produtos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const sections = useMemo(() => {
    const interleaved: ({ type: 'category'; data: CategoryWithProducts } | { type: 'seller'; data: SellerWithProducts })[] = []
    const maxLength = Math.max(categories.length, sellers.length)
    for (let i = 0; i < maxLength; i++) {
      if (categories[i]) interleaved.push({ type: 'category', data: categories[i] })
      if (sellers[i]) interleaved.push({ type: 'seller', data: sellers[i] })
    }
    return interleaved
  }, [categories, sellers])

  return (
    <main>
      <AchadinhosDoZacaBanner products={bannerProducts.map(transformProductForClient)} isLoading={isLoading} />
      {isLoading && (
        <div className="container mx-auto py-12">
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-12 w-1/3 mb-6" />
                <div className="flex gap-4">
                  {[...Array(5)].map((_, j) => <ProductCardSkeleton key={j} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoading && sections.length > 0 && (
        <div className="flex flex-col gap-20 py-12 md:gap-28 lg:gap-32">
          {sections.map((section, index) => {
            if (section.type === 'seller') {
              return <SellerSection key={`seller-${section.data.id}`} seller={section.data} />
            }
            if (section.type === 'category') {
              if ((index + 1) % 4 === 0 && section.data.products.length >= 3) {
                return (
                  <FeaturedCategorySection
                    key={`featured-${section.data.id}`}
                    category={section.data}
                    orientation={(index + 1) % 8 === 0 ? 'right' : 'left'}
                  />
                )
              }
              return <CategorySection key={`category-${section.data.id}`} category={section.data} />
            }
            return null
          })}
        </div>
      )}
      {!isLoading && sections.length === 0 && (
        <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-3xl font-bold">Nenhum Produto Encontrado</h2>
          <p className="mt-2 text-muted-foreground">Nossas prateleiras estão vazias por enquanto. Volte em breve!</p>
          <Button asChild className="mt-6"><Link href="/">Voltar para a Home</Link></Button>
        </div>
      )}
    </main>
  )
}
