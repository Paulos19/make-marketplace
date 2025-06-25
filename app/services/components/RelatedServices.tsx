'use client'

import { ProductCard } from '@/app/products/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Prisma } from '@prisma/client';

type ServiceWithDetails = Prisma.ProductGetPayload<{
    include: {
      user: true;
      category: true;
    };
}>;

interface RelatedServicesProps {
    services: ServiceWithDetails[];
}

// Função auxiliar para adaptar os dados para o ProductCard
const transformForCard = (service: ServiceWithDetails) => {
    return {
        ...service,
        categories: service.category ? [service.category] : [],
    };
};

export function RelatedServices({ services }: RelatedServicesProps) {
  return (
    <div className="mt-24">
      <Separator />
      <div className="py-16">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
          Outros Serviços que pode gostar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ProductCard key={service.id} product={transformForCard(service as any)} />
          ))}
        </div>
      </div>
    </div>
  );
}
