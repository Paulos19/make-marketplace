"use client"

import { useMemo } from 'react'
import { MotionDiv, MotionSection } from '@/components/MotionDiv'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { ChevronRight, Rocket, PackageOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard, ProductCardSkeleton } from './components/ProductCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Separator } from '@/components/ui/separator'
import { useProductPageData } from '@/lib/hooks/useProductPageData' // Import the new hook
import { HorizontalScrollArea } from '@/components/ui/HorizontalScrollArea' // Import the new scroll component

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

// --- Componente de Scroll de Produtos (agora usando HorizontalScrollArea) ---
const ProductScrollArea = ({ products }: { products: ProductWithDetails[] }) => {
    // Filtra produtos para garantir que tenham imagens antes de renderizar
    const productsWithImages = useMemo(() => products.filter(p => p.images && p.images.length > 0), [products]);

    if (productsWithImages.length === 0) {
        return <div className="text-center text-sm text-muted-foreground py-4">Nenhum item com imagem para exibir.</div>;
    }

    return (
      <HorizontalScrollArea>
        {productsWithImages.map((product) => (
          <div key={product.id} className="w-48 flex-shrink-0 md:w-56">
            <ProductCard product={transformForCard(product)} />
          </div>
        ))}
      </HorizontalScrollArea>
    )
}

// --- NOVO COMPONENTE: Grid de Produtos Turbinados (agora usando HorizontalScrollArea) ---
const BoostedProductsGrid = ({ products, isLoading }: { products: ProductWithDetails[], isLoading: boolean }) => {
  if (isLoading) {
      return (
          <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
              <Skeleton className="h-12 w-1/2 mx-auto mb-10" />
              <div className="flex gap-4 overflow-x-hidden pb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-48 flex-shrink-0 md:w-56">
                      <ProductCardSkeleton />
                    </div>
                  ))}
              </div>
          </div>
      );
  }

  if (products.length === 0) {
      return null;
  }

  return (
      <MotionSection className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
          <MotionDiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center mb-10"
          >
              <h2 className="text-3xl md:text-4xl font-bangers tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400 flex items-center justify-center gap-3">
                  <Rocket className="h-8 w-8 text-blue-400" />
                  Turbinados do Zaca
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Uma seleção turbinada de produtos e serviços, psit!</p>
          </MotionDiv>
          
          <HorizontalScrollArea>
            {products.map((product) => (
              <MotionDiv 
                key={product.id} 
                className="w-48 flex-shrink-0 md:w-56"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
              >
                <ProductCard product={transformForCard(product)} />
              </MotionDiv>
            ))}
          </HorizontalScrollArea>
      </MotionSection>
  );
};


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
    <MotionSection
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto grid min-h-screen grid-cols-1 items-center gap-6 md:grid-cols-10">
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
    </MotionSection>
  )
}

// --- Componente Principal da Página ---
export default function ProductsPage() {
  const { boostedProducts, categories, sellers, isLoading, error } = useProductPageData(); // Use the new hook

  const sections = useMemo(() => {
    const interleaved: ({ type: 'category'; data: CategoryWithProducts } | { type: 'seller'; data: SellerWithProducts })[] = []
    const maxLength = Math.max(categories.length, sellers.length)
    for (let i = 0; i < maxLength; i++) {
      if (categories[i]) interleaved.push({ type: 'category', data: categories[i] })
      if (sellers[i]) interleaved.push({ type: 'seller', data: sellers[i] })
    }
    return interleaved
  }, [categories, sellers])

  if (error) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h2 className="mt-6 text-3xl font-bold text-red-500">Erro ao carregar dados</h2>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <Button asChild className="mt-6"><Link href="/">Voltar para a Home</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"> {/* Added gradient background */}
      <BoostedProductsGrid products={boostedProducts} isLoading={isLoading} />
      
      {boostedProducts.length > 0 && <Separator className="my-12 container" />}
      
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
      {!isLoading && sections.length === 0 && boostedProducts.length === 0 && (
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