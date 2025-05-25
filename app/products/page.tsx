"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';


import { Search, XCircle, PackageOpen, TrendingUp, PercentDiamond, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from './components/ProductPage';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

interface UserInfo { id: string; name?: string | null; whatsappLink?: string | null; }
interface Category { id: string; name: string; }
interface Product { id: string; name: string; description?: string | null; price: number; originalPrice?: number | null; onPromotion?: boolean | null; imageUrls: string[]; user: UserInfo; createdAt: string; categories: Category[]; }


const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cardListVariants = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
  hidden: {},
};

const cardItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};


export default function AllProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); 
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products?all=true'), 
          fetch('/api/categories')
        ]);

        if (!productsResponse.ok) {
          const errorData = await productsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao buscar produtos');
        }
        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao buscar categorias');
        }

        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setAllProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategoryId ? product.categories?.some(cat => cat.id === selectedCategoryId) : true;
      
      let priceToCompare = product.price; 

      const matchesMinPrice = minPrice ? priceToCompare >= parseFloat(minPrice) : true;
      const matchesMaxPrice = maxPrice ? priceToCompare <= parseFloat(maxPrice) : true;
      return matchesSearchTerm && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  }, [allProducts, searchTerm, selectedCategoryId, minPrice, maxPrice]);
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setMinPrice('');
    setMaxPrice('');
  };

  const recentlyAddedProducts = useMemo(() => {
    return [...allProducts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [allProducts]);

  const promotionalProducts = useMemo(() => {
    return allProducts.filter(p => p.onPromotion).slice(0, 8); 
  }, [allProducts]);

  const productsByCategory = useMemo(() => {
    const grouped: { [key: string]: Product[] } = {};
    categories.forEach(category => {
      const prodsInCategory = allProducts.filter(p => p.categories?.some(cat => cat.id === category.id));
      if (prodsInCategory.length > 0) {
        grouped[category.name] = prodsInCategory.slice(0, 4); 
      }
    });
    return grouped;
  }, [allProducts, categories]);

  const areFiltersActive = searchTerm || selectedCategoryId || minPrice || maxPrice;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-grow">
        {}
        <motion.section 
          className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Image
            src="/1.jpg" 
            alt="Banner da Página de Produtos MakeStore"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-8 text-center">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            >
              Explore Nossos Produtos
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl text-gray-200 max-w-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            >
              Descubra a coleção completa de maquiagens e cosméticos da MakeStore.
            </motion.p>
          </div>
        </motion.section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible" 
          >
            <Card className="mb-10 shadow-md dark:bg-gray-800/70 dark:border-gray-700/60">
              <CardHeader className="pb-4 border-b dark:border-gray-700/60">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <CardTitle className="text-2xl font-semibold flex items-center text-gray-800 dark:text-gray-100">
                    <SlidersHorizontal className="mr-3 h-6 w-6 text-sky-600 dark:text-sky-500"/>
                    Filtrar Produtos
                  </CardTitle>
                  <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="mt-2 sm:mt-0 lg:hidden dark:text-gray-300 dark:hover:bg-gray-700">
                    {showFilters ? 'Esconder Filtros' : 'Mostrar Filtros'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`pt-6 ${showFilters || typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="search" className="text-sm font-medium dark:text-gray-300">Buscar por Nome/Descrição</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <Input 
                        id="search"
                        placeholder="Ex: Batom vermelho, rímel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-sm font-medium dark:text-gray-300">Categoria</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger id="category" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50">
                        <SelectValue placeholder="Todas as Categorias" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50">
                        {/* <SelectItem value="" className="dark:hover:bg-gray-700">Todas as Categorias</SelectItem> */}
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id} className="dark:hover:bg-gray-700">{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minPrice" className="text-sm font-medium dark:text-gray-300">Preço Mín. (R$)</Label>
                    <Input 
                      id="minPrice"
                      type="number"
                      placeholder="Ex: 10.00"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 dark:placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxPrice" className="text-sm font-medium dark:text-gray-300">Preço Máx. (R$)</Label>
                    <Input 
                      id="maxPrice"
                      type="number"
                      placeholder="Ex: 100.00"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                {areFiltersActive && (
                  <div className="mt-5 flex justify-end">
                    <Button variant="ghost" onClick={resetFilters} className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                      <XCircle className="mr-2 h-4 w-4" /> Limpar Filtros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {}
          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={cardListVariants}
              initial="hidden"
              animate="visible"
            >
              {[...Array(8)].map((_, i) => <motion.div key={i} variants={cardItemVariants}><ProductCardSkeleton /></motion.div>)}
            </motion.div>
          ) : error ? (
             <div className="text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-3"/>
                <p className="text-xl font-medium text-red-600 dark:text-red-400">Erro ao carregar produtos.</p>
                <p className="text-gray-600 dark:text-gray-500 mt-1">{error}</p>
             </div>
          ) : (areFiltersActive) ? (
            <>
              <motion.h2 
                className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              >
                Resultados ({filteredProducts.length})
              </motion.h2>
              {filteredProducts.length === 0 && (
                <motion.div className="text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"/>
                  <p className="text-xl text-gray-600 dark:text-gray-400">Nenhum produto encontrado com os filtros aplicados.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Tente ajustar sua busca ou limpar os filtros.</p>
                </motion.div>
              )}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8"
                variants={cardListVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} variants={cardItemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <>
              {}
              {recentlyAddedProducts.length > 0 && (
                <motion.section className="mb-16" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-gray-800 dark:text-gray-100">
                    <TrendingUp className="mr-3 h-7 w-7 text-sky-600 dark:text-sky-500"/> Adicionados Recentemente
                  </h2>
                  <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8" variants={cardListVariants}>
                    {recentlyAddedProducts.map((product) => (
                       <motion.div key={product.id} variants={cardItemVariants}><ProductCard product={product} /></motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {promotionalProducts.length > 0 && (
                <motion.section className="mb-16" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-gray-800 dark:text-gray-100">
                    <PercentDiamond className="mr-3 h-7 w-7 text-red-500 dark:text-red-400"/> Em Promoção
                  </h2>
                  <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8" variants={cardListVariants}>
                    {promotionalProducts.map((product) => (
                       <motion.div key={product.id} variants={cardItemVariants}><ProductCard product={product} /></motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {Object.entries(productsByCategory).map(([categoryName, prods]) => (
                prods.length > 0 && (
                  <motion.section key={categoryName} className="mb-16" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100">{categoryName}</h2>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8" variants={cardListVariants}>
                      {prods.map((product) => (
                         <motion.div key={product.id} variants={cardItemVariants}><ProductCard product={product} /></motion.div>
                      ))}
                    </motion.div>
                     {allProducts.filter(p => p.categories?.some(cat => cat.name === categoryName)).length > 4 && ( 
                        <div className="mt-8 text-center">
                            <Button variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Link href={`/categories/${categories.find(c => c.name === categoryName)?.id || categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                                    Ver todos em {categoryName}
                                </Link>
                            </Button>
                        </div>
                    )}
                  </motion.section>
                )
              ))}
              
              {allProducts.length === 0 && !isLoading && (
                 <div className="text-center py-10">
                    <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"/>
                    <p className="text-xl text-gray-600 dark:text-gray-400">Nenhum produto disponível no momento.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Volte em breve para conferir as novidades!</p>
                 </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}