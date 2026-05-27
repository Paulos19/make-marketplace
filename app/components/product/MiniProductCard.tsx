'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Prisma, Product } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Wrench, Tag } from 'lucide-react'

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

export function MiniProductCard({ product }: ProductCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const itemUrl = product.isService ? `/services/${product.id}` : `/products/${product.id}`;
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/img-placeholder.png';
  
  return (
    <Link href={itemUrl} className="group flex flex-col outline-none w-full h-full" tabIndex={-1}>
        <div className="relative flex-1 rounded-[1.5rem] overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
            
            {/* Background Image Full Bleed */}
            <Image
                src={firstImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Badges de Tipo (Top Left) */}
            <Badge variant="secondary" className={cn(
                "absolute top-3 left-3 z-10 border-none px-2.5 py-1 text-[10px] font-bold shadow-lg backdrop-blur-md",
                product.isService ? "bg-sky-500/80 text-white" : "bg-amber-500/80 text-white"
            )}>
                {product.isService ? <Wrench className="mr-1 h-3 w-3"/> : <Tag className="mr-1 h-3 w-3"/>}
                {product.isService ? 'Serviço' : 'Produto'}
            </Badge>

            {/* Price Badge (Top Right - Revelado no Hover ou fixo?) Fixo no bottom fica melhor */}

            {/* Conteúdo no Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end z-20">
                <h3 className="truncate font-black text-white text-lg leading-tight mb-1 group-hover:text-zaca-lilas transition-colors">
                    {product.name}
                </h3>
                
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[12px] text-white/70 font-medium truncate max-w-[50%]">
                        {product?.user?.storeName || product?.user?.name || "Vendedor Local"}
                    </p>
                    
                    <div className="text-right">
                         {product.priceType === 'ON_BUDGET' ? (
                            <span className="font-bold text-white text-sm bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">A combinar</span>
                        ) : (
                            <div className="flex flex-col items-end">
                                {product.onPromotion && product.originalPrice && (
                                    <span className="text-[10px] text-red-300 line-through leading-none mb-0.5 font-medium">
                                        {formatCurrency(product.originalPrice || 0)}
                                    </span>
                                )}
                                <span className="font-black text-white text-base leading-none bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">
                                    {formatCurrency(product.price || 0)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </Link>
  )
}
