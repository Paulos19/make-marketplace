"use client"

import { useEffect, useState } from 'react';
import { Prisma } from '@prisma/client';

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

interface ProductPageData {
  boostedProducts: ProductWithDetails[];
  categories: CategoryWithProducts[];
  sellers: SellerWithProducts[];
  isLoading: boolean;
  error: Error | null;
}

export const useProductPageData = (): ProductPageData => {
  const [boostedProducts, setBoostedProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors

        const [boostedRes, categoriesRes, sellersRes] = await Promise.all([
          fetch(`/api/products/boosted`),
          fetch(`/api/products/by-category`),
          fetch(`/api/sellers/featured`),
        ]);

        if (!boostedRes.ok) throw new Error(`Failed to fetch boosted products: ${boostedRes.statusText}`);
        if (!categoriesRes.ok) throw new Error(`Failed to fetch categories: ${categoriesRes.statusText}`);
        if (!sellersRes.ok) throw new Error(`Failed to fetch featured sellers: ${sellersRes.statusText}`);
        
        const boostedData = await boostedRes.json();
        const categoriesData = await categoriesRes.json();
        const sellersData = await sellersRes.json();

        setBoostedProducts(boostedData.products || boostedData); // API might return { products: [...] } or just [...]
        setCategories(categoriesData);
        setSellers(sellersData);
      } catch (err) {
        console.error("Error loading product page data:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { boostedProducts, categories, sellers, isLoading, error };
};