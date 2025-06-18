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
  const [baseProductsData, setBaseProductsData] = useState<Product[]>([]);
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
        const bannerProductsResponse = await fetch(`/api/products?limit=${PRODUCTS_FOR_BANNER_COUNT}&sort=createdAt:desc`);
        if (bannerProductsResponse.ok) {
            const bannerData = await bannerProductsResponse.json();
            setBannerProductsData(Array.isArray(bannerData) ? bannerData.filter(p => p.user) : []);
        }
        setIsLoadingBannerContent(false);

        const [mainGridProductsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/products`),
          fetch('/api/categories')
        ]);

        if (!mainGridProductsResponse.ok) throw new Error('Falha ao buscar os achadinhos do Zaca');
        const productsData = await mainGridProductsResponse.json();
        setBaseProductsData(Array.isArray(productsData) ? productsData : []);

        if (!categoriesResponse.ok) throw new Error('Falha ao buscar as categorias do Zaca');
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Um erro inesperado aconteceu!');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedProducts = useMemo(() => {
    let products = [...baseProductsData];

    if (searchTerm) products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategoryId) products = products.filter(p => p.categories.some(c => c.id === selectedCategoryId));
    const numMin = parseFloat(minPrice);
    if (!isNaN(numMin)) products = products.filter(p => p.price >= numMin);
    const numMax = parseFloat(maxPrice);
    if (!isNaN(numMax)) products = products.filter(p => p.price <= numMax);
    
    const [field, order] = sortBy.split(':');
    products.sort((a, b) => {
        const valA = field === 'price' ? a.price : new Date(a.createdAt).getTime();
        const valB = field === 'price' ? b.price : new Date(b.createdAt).getTime();
        return order === 'asc' ? valA - valB : valB - valA;
    });

    return products;
  }, [baseProductsData, searchTerm, selectedCategoryId, minPrice, maxPrice, sortBy]);

  const groupedProducts = useMemo(() => {
    if (selectedCategoryId) {
        const cat = categories.find(c => c.id === selectedCategoryId);
        return cat && processedProducts.length > 0 ? { [cat.name]: processedProducts } : {};
    }
    return processedProducts.reduce((acc, p) => {
      const catName = p.categories?.[0]?.name || 'Outros Achadinhos';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [processedProducts, selectedCategoryId, categories]);
  
  const resetFilters = () => {
    setSearchTerm(''); setSelectedCategoryId(''); setMinPrice(''); setMaxPrice(''); setSortBy('createdAt:desc'); setIsFilterSheetOpen(false);
  };

  // <<< CORREÇÃO APLICADA AQUI >>>
  // A verificação agora usa `Boolean()` para garantir que o resultado seja sempre `true` ou `false`.
  const areFiltersActive = 
    Boolean(searchTerm) || 
    Boolean(selectedCategoryId) || 
    Boolean(minPrice) || 
    Boolean(maxPrice) || 
    (sortBy !== 'createdAt:desc');

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <motion.main className="flex-grow" variants={pageVariants} initial="hidden" animate="visible">
        
        <AchadinhosDoZacaBanner 
          products={bannerProductsData} 
          isLoading={isLoadingBannerContent} 
        />
        
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
                    <FilterIconLucide className="mr-2 h-5 w-5" /> Opções do Zaca Filtro
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
                  onResetFilters={resetFilters}
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
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(10)].map((_, i) => <ProductCardSkeleton key={`skel-grid-${i}`} />)}
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <AlertCircle className="mx-auto h-12 w-12 text-zaca-vermelho mb-3"/>
                <p className="text-xl font-semibold text-zaca-vermelho">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-zaca-azul hover:bg-zaca-azul/90 text-white">Recarregar</Button>
              </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <PackageOpen className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4"/>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Nenhum produto encontrado</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tente ajustar os filtros para ver mais achadinhos.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedProducts).map(([categoryName, productsInCategory]) => (
                <motion.section key={categoryName} variants={itemVariants}>
                    <div className="flex justify-between items-baseline mb-6 border-b-2 border-zaca-lilas/30 pb-2">
                        <h2 className="text-2xl font-bangers text-slate-800 dark:text-slate-200 tracking-wide">{categoryName}</h2>
                        <Button asChild variant="link" className="pr-0 text-zaca-azul dark:text-zaca-lilas text-sm">
                            <Link href={`/products?category=${categories.find(c => c.name === categoryName)?.id || ''}`}>
                                Ver tudo <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <motion.div 
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
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
