'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { Button } from '@/components/ui/button'
import type { HomePageBanner } from '@prisma/client'

interface HeroCarouselProps {
  banners: HomePageBanner[]
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  if (!banners || banners.length === 0) {
    return (
        // Altura do fallback também foi ajustada
        <div className="w-full h-[50vh] sm:h-[65vh] lg:h-[calc(100vh-4rem)] bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum banner ativo.</p>
        </div>
    )
  }

  return (
    <Carousel
      className="w-full"
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      opts={{
        loop: true,
      }}
    >
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <div className="relative">
              {/* <<< CORREÇÃO APLICADA AQUI >>> */}
              {/* A altura em dispositivos móveis foi reduzida de h-[60vh] para h-[50vh] */}
              <div className="h-[20vh] sm:h-[65vh] lg:h-[calc(100vh-4rem)] w-full">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 sm:p-12 md:p-16 text-white">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                  {banner.title}
                </h1>
                {banner.linkUrl && (
                  <Button asChild className="mt-4" size="lg">
                    <Link href={banner.linkUrl}>Ver Ofertas</Link>
                  </Button>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex" />
    </Carousel>
  )
}
