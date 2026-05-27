'use client'

import { Prisma } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Card Netflix-style inline — não depende de Image fill
function NetflixCard({ product }: { product: ProductWithDetails }) {
  const itemUrl = product.isService ? `/services/${product.id}` : `/products/${product.id}`;
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/img-placeholder.png';

  return (
    <Link href={itemUrl} className="group block rounded-xl overflow-hidden relative transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
      {/* Imagem com dimensões explícitas */}
      <div className="relative w-full" style={{ paddingBottom: '133%' }}>
        <Image
          src={firstImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h4 className="text-white font-bold text-sm sm:text-base leading-tight truncate mb-1 group-hover:text-blue-300 transition-colors">
            {product.name}
          </h4>
          <p className="text-white/60 text-[11px] sm:text-xs truncate mb-1.5">
            {product.user?.storeName || product.user?.name || 'Vendedor Local'}
          </p>
          <span className="inline-block text-white font-black text-xs sm:text-sm bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-md">
            {product.priceType === 'ON_BUDGET' ? 'A combinar' : formatCurrency(product.price || 0)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ModernProductSection({
  title,
  bannerImageUrl,
  bannerFontColor,
  products,
  id
}: ModernProductSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!products || products.length === 0) return null;

  const sectionLink = `/products?section=${title.toLowerCase().replace(/ /g, '-')}`;
  const featured = products[0];
  const featuredUrl = featured.isService ? `/services/${featured.id}` : `/products/${featured.id}`;

  return (
    <section className="relative bg-[#050505]">

      {/* ═══ BANNER FULL-WIDTH ═══ */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] overflow-hidden group">
        <Image
          src={bannerImageUrl}
          alt={`Banner para ${title}`}
          fill
          className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 w-full pb-24 sm:pb-20 px-6 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-4"
              style={{ color: bannerFontColor || '#ffffff' }}
            >
              {title}
            </motion.h2>

            <p className="text-white/70 text-base sm:text-lg font-light mb-6 max-w-lg line-clamp-2">
              {featured.name} — {featured.priceType === 'ON_BUDGET' ? 'Sob consulta' : formatCurrency(featured.price || 0)}
              {featured.user?.storeName && ` • por ${featured.user.storeName}`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full h-12 px-8 bg-white text-black hover:bg-white/90 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300">
                <Link href={featuredUrl}>
                  <Play className="mr-2 h-5 w-5 fill-current" /> Ver Destaque
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold backdrop-blur-md transition-all duration-300">
                <Link href={sectionLink}>
                  Explorar Tudo <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CARROSSEL NETFLIX ═══ */}
      <div className="relative z-20 -mt-12 sm:-mt-16 px-4 sm:px-10 lg:px-16 pb-10 sm:pb-14">
        {/* Header da fila */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-white/90 tracking-tight">
            Produtos desta coleção
          </h3>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={cn(
                "rounded-full h-9 w-9 flex items-center justify-center border border-white/10 bg-white/5 transition-all duration-300",
                canScrollPrev ? "text-white hover:bg-white/15 cursor-pointer" : "text-white/20 cursor-default"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={cn(
                "rounded-full h-9 w-9 flex items-center justify-center border border-white/10 bg-white/5 transition-all duration-300",
                canScrollNext ? "text-white hover:bg-white/15 cursor-pointer" : "text-white/20 cursor-default"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 sm:gap-4">
            {products.slice(0, 12).map((product) => (
              <div
                key={product.id}
                className="flex-[0_0_45%] sm:flex-[0_0_30%] md:flex-[0_0_22%] lg:flex-[0_0_18%] xl:flex-[0_0_15%] min-w-0"
              >
                <NetflixCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
