"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { HomePageBanner } from '@prisma/client'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import Link from 'next/link'

export function HeroCarousel({ banners }: { banners: HomePageBanner[] }) {
  if (banners.length === 0) {
    // Fallback caso não haja banners
    return (
      <section className="relative flex h-[50vh] min-h-[350px] w-full items-center justify-center bg-gradient-to-r from-purple-100 via-pink-100 to-fuchsia-100">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Bem-vindo ao Zacaplace
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Seu novo lugar para encontrar achados incríveis.
          </p>
        </div>
      </section>
    )
  }

  return (
    <Carousel
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
      className="w-full"
      opts={{ loop: true }}
    >
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <Link href={banner.linkUrl || '/products'}>
              <div className="relative h-[100vh] min-h-[350px] w-full">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                    {banner.title}
                  </h1>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4" />
      <CarouselNext className="absolute right-4" />
    </Carousel>
  )
}
