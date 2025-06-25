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
        <div className="w-full h-[50vh] sm:h-[65vh] lg:h-[calc(100vh-4rem)] bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum banner ativo.</p>
        </div>
    )
  }

  return (
    // Este wrapper restringe o carrossel em dispositivos móveis e o torna de largura total em desktops
    <div className="container mx-auto px-4 pt-4 md:p-0 md:container-none">
      <Carousel
        className="w-full"
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false, // Permite que o autoplay continue mesmo após interação do usuário
          }),
        ]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              {/* Este div agora tem cantos arredondados e overflow escondido para o efeito retangular */}
              <div className="relative overflow-hidden rounded-xl md:rounded-none">
                <div className="h-[23vh] sm:h-[65vh] lg:h-[calc(100vh-4rem)] w-full">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    priority={index === 0} // Prioriza o carregamento do primeiro banner
                    className="object-cover"
                  />
                </div>
                {/* O overlay escuro para legibilidade do texto */}
                <div className="absolute inset-0" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 md:p-16 text-white">
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
        {/* Setas de navegação visíveis apenas em telas maiores */}
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      </Carousel>
    </div>
  )
}
