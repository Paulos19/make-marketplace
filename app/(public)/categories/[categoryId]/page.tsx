import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FeaturedBoostedHero } from '@/app/components/product/FeaturedBoostedHero'
import { ActiveSellersCarousel } from '@/app/components/product/ActiveSellersCarousel'
import { AdvancedFiltersSidebar } from '@/app/components/product/AdvancedFiltersSidebar'
import { MiniProductCard } from '@/app/components/product/MiniProductCard'
import { PackageOpen, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
    }
}

interface CategoryPageProps {
  params: Promise<{
    categoryId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const categoryIcons: Record<string, IconName> = {
    'Moda': 'shirt',
    'Tecnologia': 'smartphone',
    'Casa': 'home',
    'Beleza': 'sparkles',
    'Infantil': 'baby',
    'Esportes': 'dumbbell',
    'default': 'shapes',
}

const getCategoryIcon = (categoryName: string): IconName => {
    for (const key in categoryIcons) {
        if (categoryName.toLowerCase().includes(key.toLowerCase())) {
            return categoryIcons[key]
        }
    }
    return categoryIcons['default']
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { categoryId } = params;

  // Busca a categoria atual primeiro
  const currentCategory = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!currentCategory) {
    notFound();
  }

  const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page)) : 1;
  
  const take = 16;
  const skip = (page - 1) * take;

  const whereClause: Prisma.ProductWhereInput = {
    categoryId: categoryId,
    isSold: false,
    isReserved: false,
    isService: false, 
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};
    if (minPrice !== undefined) whereClause.price.gte = minPrice;
    if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
  }

  let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price_asc') orderByClause = { price: 'asc' };
  if (sort === 'price_desc') orderByClause = { price: 'desc' };

  // Busca tudo em paralelo
  const [boostedProducts, sellers, filteredProducts, totalProductsCount, allCategories] = await Promise.all([
    // Produtos Turbinados desta categoria
    prisma.product.findMany({
      where: {
        categoryId: categoryId,
        boostedUntil: { gte: new Date() },
        isSold: false,
        isReserved: false,
        isService: false,
      },
      include: { user: true, category: true },
      orderBy: { boostedUntil: 'asc' },
      take: 5,
    }),
    // Lojistas Ativos que vendem nesta categoria
    prisma.user.findMany({
      where: {
        role: 'SELLER',
        showInSellersPage: true,
        products: { some: { categoryId: categoryId, isService: false, isSold: false } }
      },
      include: { 
        products: { 
          where: { categoryId: categoryId, isService: false, isSold: false },
          include: { user: true, category: true },
          take: 5
        } 
      },
      take: 10,
    }),
    // Produtos filtrados e paginados
    prisma.product.findMany({
      where: whereClause,
      include: { user: true, category: true },
      orderBy: orderByClause,
      take: take,
      skip: skip,
    }),
    // Total de produtos na categoria
    prisma.product.count({
      where: whereClause,
    }),
    // Todas as categorias para o filtro da sidebar poder funcionar caso tiremos o `hideCategoryFilter`
    prisma.category.findMany()
  ]);

  const totalPages = Math.ceil(totalProductsCount / take);

  const getPageUrl = (newPage: number) => {
    const urlParams = new URLSearchParams();
    if (minPrice) urlParams.set('minPrice', minPrice.toString());
    if (maxPrice) urlParams.set('maxPrice', maxPrice.toString());
    if (sort !== 'newest') urlParams.set('sort', sort);
    urlParams.set('page', newPage.toString());
    return `/categories/${categoryId}?${urlParams.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      
      {/* HEADER DA CATEGORIA */}
      <header className="relative w-full bg-slate-950 py-16 md:py-24 text-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-full mb-6">
                 <Icon name={getCategoryIcon(currentCategory.name)} className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4">
                {currentCategory.name}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                Descubra os melhores achadinhos e explore {totalProductsCount} produtos disponíveis.
            </p>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        {/* Destaques (Turbinados da Categoria) */}
        {boostedProducts.length > 0 && page === 1 && (
            <div className="mb-12">
                <FeaturedBoostedHero products={boostedProducts} />
            </div>
        )}

        {/* Lojistas Ativos (Bestsellers da Categoria) */}
        {sellers.length > 0 && page === 1 && (
            <div className="mb-12">
                <ActiveSellersCarousel sellers={sellers} />
            </div>
        )}

        {/* Layout Principal: Grid de Produtos */}
        <div className="flex flex-col mt-12">
            
            {/* Header da Grid com o Trigger do Filtro */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Catálogo</h2>
                    <p className="text-muted-foreground text-sm mt-1">Exibindo resultados para {currentCategory.name}</p>
                </div>
                {/* Reutilizamos a sidebar mas escondemos as outras categorias para não fugir da atual */}
                <AdvancedFiltersSidebar categories={allCategories} hideCategoryFilter={true} />
            </div>

            {/* Grid de Produtos */}
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
                        <PackageSearch className="h-16 w-16 text-muted-foreground/50 mb-6" />
                        <h2 className="text-2xl font-black mb-2">Nenhum produto encontrado</h2>
                        <p className="text-muted-foreground max-w-md">
                            Ainda não há produtos nesta categoria com estes filtros, ou todos já foram vendidos.
                        </p>
                        <Button asChild className="mt-8 rounded-full" variant="outline">
                            <Link href={`/categories/${categoryId}`}>Limpar Filtros</Link>
                        </Button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </main>
  )
}
