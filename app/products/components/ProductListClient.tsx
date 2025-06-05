"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Product, Category } from '@/lib/types';
import ProductFilters from './ProductFilters';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { ProductCard } from './ProductCard';

interface ProductListClientProps {
  initialProducts: Product[];
  totalPages: number;
  allCategories: Category[];
}

export function ProductListClient({ initialProducts, totalPages, allCategories }: ProductListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializa o estado com os valores da URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt:desc');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Função para atualizar os parâmetros da URL
  const updateURL = useDebouncedCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Atualiza cada parâmetro
    if (searchTerm) params.set('query', searchTerm); else params.delete('query');
    if (selectedCategoryId) params.set('category', selectedCategoryId); else params.delete('category');
    if (sortBy) params.set('sortBy', sortBy); else params.delete('sortBy');
    if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');
    
    params.set('page', '1'); // Reseta para a primeira página a cada novo filtro

    router.push(`${pathname}?${params.toString()}`);
  }, 500); // 500ms de debounce para inputs de texto como busca e preço

  // Efeitos para chamar a atualização da URL quando um filtro muda
  useEffect(() => {
    // Para selects, a atualização pode ser imediata ou também com debounce
    updateURL();
  }, [selectedCategoryId, sortBy]);

  useEffect(() => {
    // Para inputs de texto, o debounce já está na chamada
    updateURL();
  }, [searchTerm, minPrice, maxPrice]);

  const onResetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setSortBy('createdAt:desc');
    setMinPrice('');
    setMaxPrice('');
    // A chamada a updateURL dentro dos useEffects cuidará da atualização da URL
    router.push(pathname); // Navega para a URL limpa imediatamente
  };

  const areFiltersActive = useMemo(() => {
    return !!searchTerm || !!selectedCategoryId || (!!sortBy && sortBy !== 'createdAt:desc') || !!minPrice || !!maxPrice;
  }, [searchTerm, selectedCategoryId, sortBy, minPrice, maxPrice]);

  return (
    <>
      <ProductFilters 
        categories={allCategories}
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
        onResetFilters={onResetFilters}
        areFiltersActive={areFiltersActive}
      />

      {initialProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
          {initialProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <PackageOpen className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
          <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Nenhum Achadinho Encontrado!</h3>
          <p className="mb-4">Parece que não encontramos produtos com esses filtros, cumpadi.</p>
          <Button asChild variant="outline" onClick={onResetFilters}>
            <Link href="/products">Limpar Filtros e Ver Todos</Link>
          </Button>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Lógica de Paginação aqui */}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}