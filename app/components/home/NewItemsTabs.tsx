'use client'

import { ProductCard } from '@/app/products/components/ProductCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { Package, Wrench } from 'lucide-react'
import { Prisma } from '@prisma/client'

// O tipo precisa ser compatível com o que o ProductCard espera
type ProductForCard = Prisma.ProductGetPayload<{
  include: { user: true; categories: true }
}> & {
  user: { name: string | null, storeName: string | null } | null;
  categories: { id: string, name: string }[];
}

interface NewItemsTabsProps {
  products: ProductForCard[]
  services: ProductForCard[]
}

export function NewItemsTabs({ products, services }: NewItemsTabsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          Chegou na Praça!
        </h2>
        <p className="mt-2 max-w-2xl mx-auto text-lg text-muted-foreground">
          Fique por dentro dos últimos achadinhos e serviços cadastrados.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Novos Produtos
            </TabsTrigger>
            <TabsTrigger value="services">
              <Wrench className="mr-2 h-4 w-4" />
              Novos Serviços
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="services">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((service) => (
              <ProductCard key={service.id} product={service as any} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.section>
  )
}