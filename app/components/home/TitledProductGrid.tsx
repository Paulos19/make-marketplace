'use client'

import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { ProductCard } from '@/app/products/components/ProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

interface TitledProductGridProps {
  title: string
  products: ProductWithDetails[]
  viewAllLink: string
}

export function TitledProductGrid({ title, products, viewAllLink }: TitledProductGridProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div 
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center justify-between mb-6"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        <Button asChild variant="ghost">
          <Link href={viewAllLink}>
            Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard product={transformProductForClient(product) as any} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}