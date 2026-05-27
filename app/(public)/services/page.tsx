import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { FeaturedBoostedHero } from '@/app/components/product/FeaturedBoostedHero'
import { CategoryPillMenu } from '@/app/components/product/CategoryPillMenu'
import { ActiveSellersCarousel } from '@/app/components/product/ActiveSellersCarousel'
import { AdvancedFiltersSidebar } from '@/app/components/product/AdvancedFiltersSidebar'
import { MiniProductCard } from '@/app/components/product/MiniProductCard'
import { PackageOpen, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
    }
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  
  const categoryId = typeof params.category === 'string' ? params.category : undefined;
  const minPrice = typeof params.minPrice === 'string' ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page)) : 1;
  
  const take = 16; // 16 itens por página
  const skip = (page - 1) * take;

  // Build the filtered query
  const whereClause: Prisma.ProductWhereInput = {
    isSold: false,
    isReserved: false,
    isService: true, // Apenas Serviços
  };

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};
    if (minPrice !== undefined) whereClause.price.gte = minPrice;
    if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
  }

  let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price_asc') orderByClause = { price: 'asc' };
  if (sort === 'price_desc') orderByClause = { price: 'desc' };

  // Fetch all parallel data (Server-Side)
  const [boostedProducts, categories, sellers, filteredProducts, totalProductsCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        boostedUntil: { gte: new Date() },
        isSold: false,
        isReserved: false,
        isService: true,
      },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 5, // Top 5 turbinados
    }),
    prisma.category.findMany({
      where: { products: { some: { isService: true } } },
    }),
    prisma.user.findMany({
      where: {
        role: 'SELLER',
        showInSellersPage: true,
        products: { some: { isService: true, isSold: false } }
      },
      include: { 
        products: { 
          where: { isService: true, isSold: false },
          include: { user: true, category: true },
          take: 5
        } 
      },
      take: 10,
    }),
    prisma.product.findMany({
      where: whereClause,
      include: { user: true, category: true },
      orderBy: orderByClause,
      take: take,
      skip: skip,
    }),
    prisma.product.count({
      where: whereClause,
    })
  ]);

  const totalPages = Math.ceil(totalProductsCount / take);

  // Helper para gerar URL da paginação
  const getPageUrl = (newPage: number) => {
    const urlParams = new URLSearchParams();
    if (categoryId) urlParams.set('category', categoryId);
    if (minPrice) urlParams.set('minPrice', minPrice.toString());
    if (maxPrice) urlParams.set('maxPrice', maxPrice.toString());
    if (sort !== 'newest') urlParams.set('sort', sort);
    urlParams.set('page', newPage.toString());
    return `/services?${urlParams.toString()}`;
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      
      {/* 1. Featured Hero (Turbinados rotativos) - FULL WIDTH NO TOPO */}
      {boostedProducts.length > 0 && page === 1 ? (
          <div className="w-full">
              <FeaturedBoostedHero products={boostedProducts} />
          </div>
      ) : (
          <div className="pt-[72px] md:pt-[88px] w-full bg-[#050505]"></div>
      )}

      {/* 2. Category Pill Menu (Faixa abaixo do banner) */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-[72px] md:top-[88px] z-30 px-4 md:px-8 py-3">
        <div className="container mx-auto">
            <CategoryPillMenu categories={categories} />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        {/* 3. Lojistas Ativos (Bestsellers / Lojas) */}
        {sellers.length > 0 && page === 1 && (
            <div className="mb-12">
                <ActiveSellersCarousel sellers={sellers} />
            </div>
        )}

        {/* 4. Layout Principal: Grid de Produtos (Full Width) */}
        <div className="flex flex-col mt-12">
            
            {/* Header da Grid com o Trigger do Filtro */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Catálogo de Serviços</h2>
                    <p className="text-muted-foreground text-sm mt-1">Encontrámos {totalProductsCount} serviços para você</p>
                </div>
                <AdvancedFiltersSidebar categories={categories} />
            </div>

            {/* Grid de Serviços */}
            <div className="w-full">
                {filteredProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="aspect-[3/4] sm:aspect-auto sm:h-[350px]">
                                    <MiniProductCard product={transformProductForClient(product) as any} />
                                </div>
                            ))}
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex items-center justify-center gap-4">
                                <Button asChild variant="outline" size="icon" disabled={page <= 1} className={page <= 1 ? "opacity-50 pointer-events-none" : ""}>
                                    <Link href={getPageUrl(page - 1)}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Link>
                                </Button>
                                
                                <span className="font-semibold text-muted-foreground mx-4">
                                    Página {page} de {totalPages}
                                </span>
                                
                                <Button asChild variant="outline" size="icon" disabled={page >= totalPages} className={page >= totalPages ? "opacity-50 pointer-events-none" : ""}>
                                    <Link href={getPageUrl(page + 1)}>
                                        <ChevronRight className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-border w-full">
                        <Wrench className="h-16 w-16 text-muted-foreground/50 mb-6" />
                        <h2 className="text-2xl font-black mb-2">Nenhum serviço encontrado</h2>
                        <p className="text-muted-foreground max-w-md">
                            Tente ajustar os filtros ou remover a categoria selecionada para ver mais serviços.
                        </p>
                        <Button asChild className="mt-8 rounded-full" variant="outline">
                            <Link href="/services">Limpar Filtros</Link>
                        </Button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </main>
  )
}
