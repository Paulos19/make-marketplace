"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { ChevronRight, ChevronLeft, PackageOpen, Rocket, Eye, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel' // Importa CarouselApi
import Autoplay from 'embla-carousel-autoplay'
import { Badge } from '@/components/ui/badge'
import { ProductCard, ProductCardSkeleton } from './components/ProductCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

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
// Tipo que o ProductCard espera, incluindo a propriedade `categories`
type ProductCardPropsType = ProductWithDetails & { categories: {id: string; name: string}[] };

// --- Função Auxiliar para transformar o produto para o formato do card ---
const transformForCard = (product: ProductWithDetails): ProductCardPropsType => {
    return {
        ...product,
        // Cria o array 'categories' que o ProductCard espera
        categories: product.category ? [product.category] : [],
    };
};

// --- Componente de Scroll de Produtos (com navegação por setas no desktop) ---
const ProductScrollArea = ({ products }: { products: ProductWithDetails[] }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
 
    // Filtra produtos para garantir que tenham imagens antes de renderizar
    const productsWithImages = useMemo(() => products.filter(p => p.images && p.images.length > 0), [products]);

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
    }, [productsWithImages, handleScroll])
 
    const scroll = (direction: 'left' | 'right') => {
      const el = scrollContainerRef.current
      if (el) {
        const scrollAmount = el.clientWidth * 0.8
        el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
      }
    }
 
    if (productsWithImages.length === 0) {
        return <div className="text-center text-sm text-muted-foreground py-4">Nenhum item com imagem para exibir.</div>;
    }

    return (
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
        >
          {productsWithImages.map((product) => (
            <div key={product.id} className="w-48 flex-shrink-0 md:w-56">
              {/* Aplica a transformação aqui */}
              <ProductCard product={transformForCard(product)} />
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

// --- Componente do Novo Banner de Produtos Turbinados ---
const BoostedProductsBanner = ({ products, isLoading }: { products: ProductWithDetails[], isLoading: boolean }) => {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) return
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    const productsWithImages = useMemo(() => products.filter(p => p.images && p.images.length > 0), [products]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 pt-4 md:px-0 md:pt-0 md:max-w-none">
                <Skeleton className="relative h-[50vh] w-full rounded-xl bg-slate-200 dark:bg-slate-800 md:h-[75vh] md:rounded-none" />
            </div>
        )
    }

    if (productsWithImages.length === 0) {
        return null; 
    }

    return (
        <div className="container mx-auto px-4 pt-4 md:max-w-none md:px-0 md:pt-0">
            <Carousel setApi={setApi} plugins={[Autoplay({ delay: 7000, stopOnInteraction: true })]} opts={{ loop: true }} className="w-full relative">
                <CarouselContent>
                    {productsWithImages.map((product) => (
                        <CarouselItem key={product.id}>
                            <div className="group relative h-[40vh] w-full overflow-hidden rounded-xl md:h-[90vh] md:rounded-none">
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                    priority
                                />
                                <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                                    <div className="container mx-auto flex flex-col items-center gap-4 p-4">
                                        <Badge variant="secondary" className="border-blue-400 bg-blue-900/50 py-2 px-4 text-sm font-semibold text-blue-300 backdrop-blur-sm">
                                            <Rocket className="mr-2 h-5 w-5" />
                                            Achadinho Turbinado
                                        </Badge>
                                        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg md:text-6xl">{product.name}</h1>
                                        <p className="text-2xl font-bold text-primary drop-shadow-md">{formatCurrency(product.price)}</p>
                                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                                            <Button asChild size="lg">
                                                <Link href={`/products/${product.id}`}><Eye className="mr-2 h-5 w-5" />Ver Detalhes</Link>
                                            </Button>
                                            <Button asChild size="lg" variant="outline" className="border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                                                <Link href={`/products/${product.id}?action=reserve`}><Heart className="mr-2 h-5 w-5" />Reservar Agora</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {productsWithImages.length > 1 && (
                  <>
                    <button onClick={() => api?.scrollPrev()} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors md:left-4">
                      <ChevronLeft className="h-6 w-6"/>
                    </button>
                    <button onClick={() => api?.scrollNext()} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors md:right-4">
                      <ChevronRight className="h-6 w-6"/>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                        {productsWithImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => api?.scrollTo(index)}
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all duration-300",
                                    current === index ? "w-6 bg-white" : "bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                  </>
                )}
            </Carousel>
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
  // Lógica mais robusta: encontra o primeiro produto com imagem para o banner
  const featuredProduct = category.products.find(p => p.images && p.images.length > 0);
  
  // Se nenhum produto na categoria tiver imagem, não renderiza a seção
  if (!featuredProduct) {
    return null;
  }
  
  // Filtra os outros produtos (que não são o do banner) e que também tenham imagem
  const otherProducts = category.products.filter(p => p.id !== featuredProduct.id && p.images && p.images.length > 0);
  const bannerImage = featuredProduct.images[0];

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
            // Aplica a transformação aqui
            <ProductCard key={product.id} product={transformForCard(product)} />
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
  const [boostedProducts, setBoostedProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [boostedRes, categoriesRes, sellersRes] = await Promise.all([
          fetch(`/api/products/boosted`),
          fetch(`/api/products/by-category`),
          fetch(`/api/sellers/featured`),
        ])
        if (!boostedRes.ok || !categoriesRes.ok || !sellersRes.ok) throw new Error('Falha ao buscar os dados da página.')
        const boostedData = await boostedRes.json()
        const categoriesData = await categoriesRes.json()
        const sellersData = await sellersRes.json()
        setBoostedProducts(boostedData.products || boostedData)
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
    <>
    <Navbar/>
    <main>
      <BoostedProductsBanner products={boostedProducts} isLoading={isLoading} />
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
              // Condição atualizada para checar se há produtos com imagens
              const productsWithImages = section.data.products.filter(p => p.images && p.images.length > 0);
              if ((index + 1) % 4 === 0 && productsWithImages.length >= 3) {
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
    <Footer/>
    </>
  )
}
