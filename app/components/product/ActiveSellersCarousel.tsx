'use client'

import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HorizontalScrollArea } from '@/components/ui/HorizontalScrollArea'
import { Store } from 'lucide-react'

type SellerWithProducts = Prisma.UserGetPayload<{
  include: { products: { include: { user: true; category: true } } }
}>

interface ActiveSellersCarouselProps {
  sellers: SellerWithProducts[]
}

export function ActiveSellersCarousel({ sellers }: ActiveSellersCarouselProps) {
  if (!sellers || sellers.length === 0) return null;

  return (
    <div className="w-full py-8 border-b border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 uppercase">
            <Store className="w-5 h-5 text-primary" />
            Lojas Ativas
        </h2>
      </div>

      <HorizontalScrollArea>
        {sellers.map((seller) => (
          <Link 
            key={seller.id} 
            href={`/seller/${seller.id}`}
            className="flex flex-col items-center gap-3 w-24 md:w-32 flex-shrink-0 group outline-none"
          >
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-0 group-hover:scale-150 transition-transform duration-500"></div>
                <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-lg group-hover:-translate-y-2 transition-transform duration-300 relative z-10">
                <AvatarImage src={seller.image || undefined} alt={seller.storeName || seller.name || 'Loja'} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-slate-100 dark:bg-slate-800">
                    {seller.storeName?.charAt(0) || seller.name?.charAt(0) || 'L'}
                </AvatarFallback>
                </Avatar>
                {/* Indicador Online/Ativo */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-background rounded-full z-20"></div>
            </div>
            
            <div className="text-center">
                <p className="font-bold text-sm md:text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {seller.storeName || seller.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {seller.products.length} itens
                </p>
            </div>
          </Link>
        ))}
      </HorizontalScrollArea>
    </div>
  )
}
