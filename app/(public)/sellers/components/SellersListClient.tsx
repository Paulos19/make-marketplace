'use client';

import { useState, useEffect } from 'react';
import { SellerCard } from './SellerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@prisma/client';

type SellerData = Pick<User, 'id' | 'name' | 'image' | 'createdAt'>;

export function SellersListClient() {
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch('/api/sellers');
        if (!response.ok) {
          throw new Error('Failed to fetch sellers');
        }
        const data = await response.json();
        setSellers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Nenhum vendedor encontrado</h2>
        <p className="text-muted-foreground">Ainda não há vendedores na nossa plataforma.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sellers.map((seller) => (
        <SellerCard key={seller.id} seller={seller} />
      ))}
    </div>
  );
}