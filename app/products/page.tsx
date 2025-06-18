"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ProductCard, ProductCardSkeleton } from './components/ProductPage';
import ProductFilters from './components/ProductFilters';


import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import { AlertCircle, PackageOpen, Sparkles, ChevronDown, SlidersHorizontal, Filter as FilterIconLucide } from 'lucide-react';
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
  onPromotion?: boolean | null | undefined; // Definição correta que permite null
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
const PRODUCTS_PER_PAGE_INITIAL = 12;

export default function AllProductsPage() {
  const router = useRouter();
  const [allProductsData, setAllProductsData] = useState<Product[]>([]);
  const [bannerProductsData, setBannerProductsData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBannerContent, setIsLoadingBannerContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt:desc');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingBannerContent(true);
      setError(null);
      try {
        const bannerProductsResponse = await fetch(`/api/products?all=true&limit=${PRODUCTS_FOR_BANNER_COUNT}&sort=createdAt:desc`);
        if (!bannerProductsResponse.ok) throw new Error('Falha ao buscar destaques do Zaca para o banner');
        const bannerData = await bannerProductsResponse.json();
        setBannerProductsData(Array.isArray(bannerData) ? bannerData.filter(p => p.user) : (bannerData.products || []).filter((p: { user: any; }) => p.user));
        setIsLoadingBannerContent(false);

        let apiUrl = `/api/products?all=true&limit=${PRODUCTS_PER_PAGE_INITIAL}&sort=${sortBy}`;
        if (searchTerm) apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        if (selectedCategoryId) apiUrl += `&categoryId=${selectedCategoryId}`;
        
        const [mainGridProductsResponse, categoriesResponse] = await Promise.all([
          fetch(apiUrl),
          fetch('/api/categories')
        ]);

        if (!mainGridProductsResponse.ok) {
          const errorData = await mainGridProductsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao buscar os achadinhos do Zaca');
        }
        const productsData = await mainGridProductsResponse.json();
        setAllProductsData(Array.isArray(productsData) ? productsData : (productsData.products || []));

        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao buscar as categorias do Zaca');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Um erro do balacobaco aconteceu!');
        console.error("Erro ao buscar dados para AllProductsPage:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sortBy, searchTerm, selectedCategoryId]);

  const filteredProductsForGrid = useMemo(() => {
    let productsToFilter = [...allProductsData];
    const numMinPrice = parseFloat(minPrice);
    const numMaxPrice = parseFloat(maxPrice);

    if (!isNaN(numMinPrice) && numMinPrice > 0) {
        productsToFilter = productsToFilter.filter(p => p.price >= numMinPrice);
    }
    if (!isNaN(numMaxPrice) && numMaxPrice > 0) {
        productsToFilter = productsToFilter.filter(p => p.price <= numMaxPrice);
    }
    return productsToFilter;
  }, [allProductsData, minPrice, maxPrice]);
  
  const resetFiltersAndCloseSheet = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt:desc');
    setIsFilterSheetOpen(false); 
  };

  const areFiltersActive = 
    Boolean(searchTerm) || 
    Boolean(selectedCategoryId) || 
    Boolean(minPrice) || 
    Boolean(maxPrice) || 
    (sortBy !== 'createdAt:desc');
  
  const bannerHighlightProduct = useMemo(() => {
    if (allProductsData.length === 0 && bannerProductsData.length === 0) return null;
    const sourceForBanner = bannerProductsData.length > 0 ? bannerProductsData : allProductsData;
    if (sourceForBanner.length === 0) return null;

    const promoProducts = sourceForBanner.filter(p => p.onPromotion && p.images && p.images.length > 0);
    if (promoProducts.length > 0) return promoProducts[Math.floor(Math.random() * promoProducts.length)];
    return sourceForBanner.find(p => p.images && p.images.length > 0) || sourceForBanner[0];
  }, [allProductsData, bannerProductsData]);

  const BannerSkeleton = () => (
    <motion.section
      className="relative py-12 sm:py-16 md:py-20 bg-slate-700 text-white text-center overflow-hidden animate-pulse min-h-[70vh] flex items-center justify-center"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="h-12 w-12 sm:h-16 sm:w-16 bg-slate-600 rounded-full mx-auto mb-4"></div>
        <div className="h-10 sm:h-12 md:h-14 bg-slate-600 rounded-md w-3/4 mx-auto mb-3"></div>
        <div className="h-6 bg-slate-600 rounded-md w-1/2 mx-auto mb-6"></div>
      </div>
    </motion.section>
  );

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
            {isLoading && filteredProductsForGrid.length === 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-6">
                {[...Array(PRODUCTS_PER_PAGE_INITIAL)].map((_, i) => <ProductCardSkeleton key={`skel-grid-${i}`} />)}
              </div>
            ) : !isLoading && error && filteredProductsForGrid.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                  <AlertCircle className="mx-auto h-12 w-12 text-zaca-vermelho mb-3"/>
                  <p className="text-xl font-semibold text-zaca-vermelho">{error}</p>
                  <Button onClick={() => router.back()} className="mt-4 bg-zaca-azul hover:bg-zaca-azul/90 text-white">Voltar, Zé!</Button>
              </div>
            ) : !isLoading && filteredProductsForGrid.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                  <PackageOpen className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4"/>
                  <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Ô psit, cadê os produtos?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">O Zaca revirou tudo, mas não achou nada com esses filtros. Tenta de novo, carinho!</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-6 max-w-full overflow-x-hidden"
                variants={cardListVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredProductsForGrid.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} className="w-full">
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}