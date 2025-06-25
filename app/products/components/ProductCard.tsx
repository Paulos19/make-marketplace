'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product, Category, User } from '@prisma/client'

// Tipo expandido para incluir as relações
type ProductWithDetails = Product & {
  categories: Category[];
  user: Pick<User, 'name' | 'storeName'>;
}

interface ProductCardProps {
  product: ProductWithDetails
}

// Função para formatar o preço
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : '/img-placeholder.png'
  
  const isOnSale = product.onPromotion && product.originalPrice && product.originalPrice > product.price;

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="group block">
        <CardHeader className="relative h-48 w-full p-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Badge de Promoção */}
          {isOnSale && (
            <Badge className="absolute right-2 top-2 bg-red-500 text-white border-none">
              Promo!
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-4">
          {product.categories[0] && (
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              {product.categories[0].name}
            </p>
          )}
          <CardTitle className="text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </CardTitle>
        </CardContent>
      </Link>
      <CardFooter className="flex flex-col items-start p-4 pt-0">
        <div className="w-full">
            {/* Lógica de exibição de preço */}
            {isOnSale ? (
                <div className="flex flex-col items-start">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        <span className="mr-2 text-muted-foreground line-through">
                            {formatPrice(product.originalPrice!)}
                        </span>
                    </p>
                    <p className="text-xl font-bold text-foreground">
                        {formatPrice(product.price)}
                    </p>
                </div>
            ) : (
                <p className="text-xl font-bold text-foreground">
                    {formatPrice(product.price)}
                </p>
            )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Vendido por: {product.user.storeName || product.user.name}
        </p>
      </CardFooter>
    </Card>
  )
}

// Skeleton para o estado de carregamento
export function ProductCardSkeleton() {
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg">
      <CardHeader className="h-48 w-full p-0">
        <Skeleton className="h-full w-full" />
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Skeleton className="mb-2 h-4 w-1/3" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-0">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </CardFooter>
    </Card>
  )
}
