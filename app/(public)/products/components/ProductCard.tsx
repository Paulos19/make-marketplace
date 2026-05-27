'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Prisma, Product } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Rocket, Wrench, Tag, Store } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type ProductCardProps = {
  product: Product & {
    user: { name: string | null, storeName: string | null } | null;
    categories: { id: string, name: string }[];
    boostedUntil: Date | null;
    onPromotion: boolean;
    originalPrice: number | null;
    priceType: string | null;
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const itemUrl = product.isService ? `/services/${product.id}` : `/products/${product.id}`;
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/img-placeholder.png';
  const isBoosted = product.boostedUntil && new Date(product.boostedUntil) > new Date();
  
  return (
    <Link href={itemUrl} className="group flex flex-col h-full outline-none" tabIndex={-1}>
        <div className="relative flex flex-col h-full w-full bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group-hover:-translate-y-1">
            
            {/* Bloco da Imagem */}
            <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <Image
                    src={firstImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient Overlay sutil no topo para os badges */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />

                {/* Badges Flutuantes Integrados */}
                <div className="absolute top-3 w-full px-3 flex justify-between items-start z-20 pointer-events-none">
                    <Badge variant="secondary" className={cn(
                        "backdrop-blur-md border-none shadow-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        product.isService ? "bg-black/50 text-white" : "bg-white/90 text-slate-900 dark:bg-black/50 dark:text-white"
                    )}>
                        {product.isService ? <Wrench className="mr-1 h-3 w-3"/> : <Tag className="mr-1 h-3 w-3"/>}
                        {product.isService ? 'Serviço' : 'Produto'}
                    </Badge>

                    {isBoosted && (
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white border-none shadow-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            <Rocket className="mr-1 h-3 w-3" />
                            Turbo
                        </Badge>
                    )}
                </div>
            </div>

            {/* Bloco de Detalhes */}
            <div className="flex flex-col flex-1 p-5">
                <div className="mb-auto">
                    <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
                        <Store className="w-3 h-3" />
                        <span className="text-xs font-medium truncate uppercase tracking-widest">{product?.user?.storeName || product?.user?.name || "Loja"}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </div>

                {/* Preço Premium */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                    <div className="flex flex-col">
                        {product.priceType === 'ON_BUDGET' ? (
                            <span className="font-bold text-sm text-slate-500 dark:text-slate-400">Sob Consulta</span>
                        ) : (
                            <>
                                {product.onPromotion && product.originalPrice && (
                                    <span className="text-[10px] text-red-500 line-through font-semibold mb-0.5">
                                        {formatCurrency(product.originalPrice)}
                                    </span>
                                )}
                                <span className={cn(
                                    "font-black text-xl tracking-tight",
                                    product.onPromotion ? "text-red-500" : "text-slate-900 dark:text-white"
                                )}>
                                    {formatCurrency(product.price || 0)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="w-full aspect-square relative">
                <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="p-5 flex flex-col flex-1">
                <Skeleton className="h-3 w-1/3 mb-3 rounded-full" />
                <Skeleton className="h-5 w-[85%] mb-2 rounded-full" />
                <Skeleton className="h-5 w-2/3 mb-4 rounded-full" />
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-6 w-1/2 rounded-full" />
                </div>
            </div>
        </div>
    )
}