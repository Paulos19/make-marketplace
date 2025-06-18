"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ProductCard, ProductCardSkeleton } from './components/ProductCard';
import ProductFilters from './components/ProductFilters';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AlertCircle, PackageOpen, SlidersHorizontal, Filter as FilterIconLucide, ArrowRight } from 'lucide-react';
import AchadinhosDoZacaBanner from '../components/AchadinhosDoZacaBanner';

// Interfaces
interface UserInfo { id: string; name?: string | null; whatsappLink?: string | null; }
interface Category { id: string; name: string; }
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  onPromotion?: boolean | null | undefined;
  images: string[];
  user: UserInfo;
  createdAt: string;
  categories: Category[];
}

// Variantes de animação
const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const cardListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const PRODUCTS_FOR_BANNER_COUNT = 5;

export default function AllProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [baseProductsData, setBaseProductsData] = useState<Product[]>([]); 
  const [bannerProductsData, setBannerProductsData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBannerContent, setIsLoadingBannerContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt:desc');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // <<< INÍCIO DA CORREÇÃO: Busca de dados agora ocorre apenas uma vez >>>
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingBannerContent(true);
      setError(null);
      try {
        // Busca do banner (sem alterações)
        const bannerProductsResponse = await fetch(`/api/products?all=true&limit=${PRODUCTS_FOR_BANNER_COUNT}&sort=createdAt:desc`);
        if (bannerProductsResponse.ok) {
          const bannerData = await bannerProductsResponse.json();
          setBannerProductsData(Array.isArray(bannerData) ? bannerData.filter(p => p.user) : []);
        }
        setIsLoadingBannerContent(false);

        // Busca a lista completa de produtos e categorias apenas uma vez
        const [mainGridProductsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/products`), // Remove a ordenação da API, será feita no cliente
          fetch('/api/categories')
        ]);

        if (!mainGridProductsResponse.ok) throw new Error('Falha ao buscar os achadinhos do Zaca');
        const productsData = await mainGridProductsResponse.json();
        setBaseProductsData(Array.isArray(productsData) ? productsData : []);

        if (!categoriesResponse.ok) throw new Error('Falha ao buscar as categorias do Zaca');
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Um erro do balacobaco aconteceu!');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Dependência vazia, executa apenas no carregamento inicial

  // Lógica de filtro e ordenação agora é feita 100% no cliente com useMemo
  const processedProducts = useMemo(() => {
    let productsToProcess = [...baseProductsData];

    // 1. FILTRAGEM
    if (searchTerm) {
      productsToProcess = productsToProcess.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategoryId) {
      productsToProcess = productsToProcess.filter(p =>
        p.categories.some(cat => cat.id === selectedCategoryId)
      );
    }
    const numMinPrice = parseFloat(minPrice);
    const numMaxPrice = parseFloat(maxPrice);
    if (!isNaN(numMinPrice) && numMinPrice > 0) {
      productsToProcess = productsToProcess.filter(p => p.price >= numMinPrice);
    }
    if (!isNaN(numMaxPrice) && numMaxPrice > 0) {
      productsToProcess = productsToProcess.filter(p => p.price <= numMaxPrice);
    }
    
    // 2. ORDENAÇÃO
    const [sortField, sortOrder] = sortBy.split(':');
    productsToProcess.sort((a, b) => {
        let valA, valB;
        if (sortField === 'price') {
            valA = a.price;
            valB = b.price;
        } else { // default to createdAt
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        }

        if (sortOrder === 'asc') {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });

    return productsToProcess;
  }, [baseProductsData, searchTerm, selectedCategoryId, minPrice, maxPrice, sortBy]);
  // <<< FIM DA CORREÇÃO >>>

  const groupedProducts = useMemo(() => {
    if (selectedCategoryId) {
        const category = categories.find(c => c.id === selectedCategoryId);
        if (category && processedProducts.length > 0) {
            return { [category.name]: processedProducts };
        }
        return {};
    }
    return processedProducts.reduce((acc, product) => {
      const categoryName = product.categories?.[0]?.name || 'Outros Achadinhos';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [processedProducts, selectedCategoryId, categories]);
  
  const resetFiltersAndCloseSheet = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt:desc');
    setIsFilterSheetOpen(false); 
  };

  const areFiltersActive = 
    Boolean(searchTerm) || Boolean(selectedCategoryId) || Boolean(minPrice) || Boolean(maxPrice) || (sortBy !== 'createdAt:desc');

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <motion.main className="flex-grow" variants={pageVariants} initial="hidden" animate="visible">
        
        <AchadinhosDoZacaBanner 
          products={bannerProductsData} 
          isLoading={isLoadingBannerContent} 
        />
        {!isLoadingBannerContent && error && bannerProductsData.length === 0 && (
            <div className="text-center py-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <p>Ai, pastor! Deu chabu pra carregar os destaques do banner: {error}</p>
            </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <motion.div variants={itemVariants} className="mb-6 md:mb-8 flex justify-between items-center">
            <h2 className="text-2xl sm:text-3xl font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wide">
              Todos os Achadinhos
            </h2>
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-zaca-azul text-zaca-azul hover:bg-zaca-azul/10 dark:border-zaca-lilas dark:text-zaca-lilas dark:hover:bg-zaca-lilas/10">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtrar / Ordenar
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-sm sm:max-w-md p-0 flex flex-col dark:bg-slate-900 border-l dark:border-slate-700">
                <SheetHeader className="px-4 sm:px-6 py-4 border-b dark:border-slate-700">
                  <SheetTitle className="text-xl font-bangers text-zaca-azul dark:text-zaca-lilas flex items-center">
                    <FilterIconLucide className="mr-2 h-5 w-5" />
                    Opções do Zaca Filtro
                  </SheetTitle>
                </SheetHeader>
                <ProductFilters
                  className="flex-grow overflow-y-auto"
                  categories={categories}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  selectedCategoryId={selectedCategoryId}
                  onSelectedCategoryIdChange={setSelectedCategoryId}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  minPrice={minPrice}
                  onMinPriceChange={setMinPrice}
                  maxPrice={maxPrice}
                  onMaxPriceChange={setMaxPrice}
                  onResetFilters={resetFiltersAndCloseSheet}
                  areFiltersActive={areFiltersActive}
                />
                <div className="p-4 border-t dark:border-slate-700 mt-auto">
                    <SheetClose asChild>
                        <Button className="w-full bg-zaca-azul hover:bg-zaca-azul/90 text-white">
                            Ver Resultados
                        </Button>
                    </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6">
            {isLoading && Object.keys(groupedProducts).length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(10)].map((_, i) => <ProductCardSkeleton key={`skel-grid-${i}`} />)}
              </div>
            ) : !isLoading && error ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                  <AlertCircle className="mx-auto h-12 w-12 text-zaca-vermelho mb-3"/>
                  <p className="text-xl font-semibold text-zaca-vermelho">{error}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4 bg-zaca-azul hover:bg-zaca-azul/90 text-white">Recarregar a página</Button>
              </div>
            ) : !isLoading && Object.keys(groupedProducts).length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                  <PackageOpen className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4"/>
                  <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Ô psit, cadê os produtos?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">O Zaca revirou tudo, mas não achou nada com esses filtros. Tenta de novo, carinho!</p>
              </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedProducts).map(([categoryName, productsInCategory]) => (
                    <motion.section key={categoryName} variants={itemVariants}>
                        <div className="flex justify-between items-baseline mb-6 border-b-2 border-zaca-lilas/30 pb-2">
                            <h2 className="text-2xl font-bangers text-slate-800 dark:text-slate-200 tracking-wide">
                            {categoryName}
                            </h2>
                            <Button asChild variant="link" className="pr-0 text-zaca-azul dark:text-zaca-lilas text-sm">
                                <Link href={`/products?category=${categories.find(c => c.name === categoryName)?.id || ''}`}>
                                    Ver tudo <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
                        variants={cardListVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        >
                        {productsInCategory.map((product) => (
                            <motion.div key={product.id} variants={itemVariants}>
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                        </motion.div>
                    </motion.section>
                    ))}
                </div>
            )}
          </motion.div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}
