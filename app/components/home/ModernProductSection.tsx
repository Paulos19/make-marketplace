import { Prisma } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/app/products/components/ProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface ModernProductSectionProps {
  id: string;
  title: string
  bannerImageUrl: string
  bannerFontColor: string
  productIds: string[]
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  products: ProductWithDetails[]
}

const transformProductForClient = (product: ProductWithDetails) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    }
}

export function ModernProductSection({
  title,
  bannerImageUrl,
  bannerFontColor,
  products,
}: ModernProductSectionProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="group relative overflow-hidden rounded-xl border bg-card shadow-lg dark:border-slate-800">
      <div className="relative h-64 w-full">
        <Image
          src={bannerImageUrl}
          alt={`Banner para ${title}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 p-6 text-center"
          style={{ color: bannerFontColor || '#FFFFFF' }}
        >
          <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-lg md:text-5xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={transformProductForClient(product) as any}
            />
          ))}
        </div>
        {products.length > 4 && (
          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link href={`/products?section=${title.toLowerCase().replace(/ /g, '-')}`}>
                Ver mais <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
