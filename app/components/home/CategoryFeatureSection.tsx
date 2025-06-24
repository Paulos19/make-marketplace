import { Prisma } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/app/products/components/ProductCard'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface CategoryFeatureSectionProps {
  category: {
    name: string
    id: string
  }
  products: ProductWithDetails[]
  reverseLayout?: boolean
}

// Função auxiliar para transformar os dados do produto para o formato que o ProductCard espera
const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

export function CategoryFeatureSection({
  category,
  products,
  reverseLayout = false,
}: CategoryFeatureSectionProps) {
  if (!products || products.length === 0) {
    return null
  }

  const mainProduct = products[0]
  const otherProducts = products.slice(1)

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-lg dark:border-slate-800">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          Destaques em {category.name}
        </h2>
      </div>
      <div
        className={cn(
          'grid grid-cols-1 gap-px bg-slate-200 dark:bg-slate-800 md:grid-cols-2',
          reverseLayout && 'md:[direction:rtl]',
        )}
      >
        <div className="group relative bg-card p-6 [direction:ltr]">
          <div className="aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={mainProduct.images[0]}
              alt={mainProduct.name}
              width={500}
              height={500}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="pb-4 pt-6 text-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              <Link href={`/products/${mainProduct.id}`}>
                <span className="absolute inset-0" />
                {mainProduct.name}
              </Link>
            </h3>
            <p className="mt-2 text-base text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(mainProduct.price)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-px bg-slate-200 dark:bg-slate-800 [direction:ltr]">
          {otherProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-card p-4 text-center"
            >
              <div className="aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="pb-2 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Link href={`/products/${product.id}`}>
                    <span className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
              </div>
            </div>
          ))}
          {/* Card para "Ver todos" */}
           <Link href={`/products?category=${category.id}`} className="group relative flex flex-col items-center justify-center bg-card p-4 text-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Ver todos</h3>
                <p className="text-sm text-muted-foreground">em {category.name}</p>
                <ArrowRight className="mt-4 h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
      </div>
    </section>
  )
}

