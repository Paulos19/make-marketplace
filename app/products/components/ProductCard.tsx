'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Prisma, Product } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Rocket, Wrench, Tag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Tipagem que o ProductCard espera receber
type ProductCardProps = {
  product: Product & {
    user: { name: string | null, storeName: string | null } | null;
    categories: { id: string, name: string }[];
    boostedUntil: Date | null;
    onPromotion: boolean;
    originalPrice: number | null;
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  // --- LÓGICA PRINCIPAL ---
  // Determina a URL correta com base no tipo de item
  const itemUrl = product.isService
    ? `/services/${product.id}`
    : `/products/${product.id}`;

  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/img-placeholder.png';
  const isBoosted = product.boostedUntil && new Date(product.boostedUntil) > new Date();
  
  return (
    <Link href={itemUrl} className="group outline-none" tabIndex={-1}>
        <Card className="h-full w-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-primary">
            <CardHeader className="relative h-48 w-full p-0">
                <Image
                    src={firstImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {isBoosted && (
                    <Badge variant="secondary" className="absolute top-2 right-2 border-blue-400 bg-blue-900/50 text-blue-300">
                        <Rocket className="mr-1 h-3 w-3" />
                        Turbo
                    </Badge>
                )}
                 <Badge variant="secondary" className={cn(
                    "absolute top-2 left-2 z-10",
                    product.isService ? "bg-sky-500/80 text-white" : "bg-amber-500/80 text-white"
                )}>
                    {product.isService ? <Wrench className="mr-1.5 h-3 w-3"/> : <Tag className="mr-1.5 h-3 w-3"/>}
                    {product.isService ? 'Serviço' : 'Produto'}
                </Badge>
            </CardHeader>
            <CardContent className="p-4">
                <h3 className="truncate font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{product?.user?.storeName || product?.user?.name || "Vendedor não informado"}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <div className="flex w-full items-end justify-between">
                    <div>
                        {product.onPromotion && product.originalPrice && (
                            <p className="text-xs text-red-500 line-through">{formatCurrency(product.originalPrice)}</p>
                        )}
                        <p className="font-bold text-lg text-primary">{formatCurrency(product.price)}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    </Link>
  )
}

// O esqueleto do card permanece o mesmo
export function ProductCardSkeleton() {
    return (
        <Card className="h-full w-full overflow-hidden">
            <CardHeader className="relative h-48 w-full p-0">
                <Skeleton className="h-full w-full" />
            </CardHeader>
            <CardContent className="p-4">
                <Skeleton className="h-5 w-4/5 mb-2" />
                <Skeleton className="h-4 w-3/5" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
                 <Skeleton className="h-6 w-1/3" />
            </CardFooter>
        </Card>
    )
}
