// app/products/components/ProductFilters.tsx
"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, XCircle, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCategoryId: string;
  onSelectedCategoryIdChange: (id: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  minPrice: string;
  onMinPriceChange: (price: string) => void;
  maxPrice: string;
  onMaxPriceChange: (price: string) => void;
  onResetFilters: () => void;
  areFiltersActive: boolean;
  className?: string;
}

export default function ProductFilters({
  categories,
  searchTerm, onSearchTermChange,
  selectedCategoryId, onSelectedCategoryIdChange,
  sortBy, onSortByChange,
  minPrice, onMinPriceChange,
  maxPrice, onMaxPriceChange,
  onResetFilters,
  areFiltersActive,
  className,
}: ProductFiltersProps) {

  return (
    <div className={cn("h-full flex flex-col", className)}> 
      <CardHeader className="pb-4 pt-5 px-4 border-b dark:border-slate-700">
        <CardTitle className="text-xl md:text-2xl font-bangers text-zaca-azul dark:text-zaca-lilas flex items-center tracking-wide">
          <ListFilter className="mr-2.5 h-6 w-6" />
          Filtrar Achadinhos, Psit!
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-5">
        <div className="grid grid-cols-1 gap-y-5 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="search-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscapé do Zaca</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <Input
                id="search-filter"
                placeholder="O que o Zaca procura hoje?"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-8 h-10 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400 focus:border-zaca-azul dark:focus:border-zaca-lilas"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Categorias</Label>
            <Select value={selectedCategoryId} onValueChange={onSelectedCategoryIdChange}>
              <SelectTrigger id="category-filter" className="h-10 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 focus:border-zaca-azul dark:focus:border-zaca-lilas">
                {/* O placeholder é exibido quando selectedCategoryId === "" */}
                <SelectValue placeholder="Todas as Trapalhadas" /> 
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50">
                {/* VERIFIQUE AQUI:
                  Certifique-se de que NÃO HÁ um <SelectItem value=""> aqui.
                  A opção "Todas as Trapalhadas" é gerenciada pelo placeholder do SelectValue.
                  Se você precisa de um item clicável para "Todas as categorias", ele NÃO PODE ter value="".
                  No entanto, o comportamento padrão e correto é que o placeholder apareça quando 
                  selectedCategoryId (o value do Select) é uma string vazia.
                */}
                {/* <SelectItem value="">Todas as Trapalhadas</SelectItem>  <-- ESTA LINHA DEVE SER REMOVIDA SE EXISTIR */ }

                {/* Opção para selecionar "Todas as categorias" explicitamente, se desejar */}
                {/* Se precisar de um item clicável para "Todas", use um valor placeholder específico */}
                {/* ou simplesmente confie no reset para limpar o filtro. */}
                {/* Para simplificar e seguir o padrão Radix, o placeholder é o ideal para "Todas". */}

                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id} className="dark:hover:bg-slate-700">{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sortBy-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Organizar o Balaio</Label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger id="sortBy-filter" className="h-10 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 focus:border-zaca-azul dark:focus:border-zaca-lilas">
                <SelectValue placeholder="Padrão" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50">
                <SelectItem value="createdAt:desc" className="dark:hover:bg-slate-700">Mais Novos Primeiro</SelectItem>
                <SelectItem value="price:asc" className="dark:hover:bg-slate-700">Preço: Baratinho pro Caro</SelectItem>
                <SelectItem value="price:desc" className="dark:hover:bg-slate-700">Preço: Caro pro Baratinho</SelectItem>
                <SelectItem value="name:asc" className="dark:hover:bg-slate-700">Nome (De A a Zaca)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="minPrice-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Preço Mín. (R$)</Label>
            <Input id="minPrice-filter" type="number" placeholder="Ex: 10" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} min="0" className="h-10 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400 focus:border-zaca-azul dark:focus:border-zaca-lilas"/>
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="maxPrice-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Preço Máx. (R$)</Label>
            <Input id="maxPrice-filter" type="number" placeholder="Ex: 100" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} min="0" className="h-10 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400 focus:border-zaca-azul dark:focus:border-zaca-lilas"/>
          </div>
        </div>
      </CardContent>
      <div className="p-4 border-t dark:border-slate-700 mt-auto">
        {areFiltersActive && (
            <Button variant="ghost" onClick={onResetFilters} className="w-full h-10 text-sm text-zaca-vermelho hover:text-zaca-vermelho/80 dark:text-zaca-vermelho dark:hover:text-zaca-vermelho/80 hover:bg-red-500/10">
            <XCircle className="mr-1.5 h-4 w-4" /> Limpar Filtros do Zaca
            </Button>
        )}
      </div>
    </div>
  );
}