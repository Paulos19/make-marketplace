'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HomePageBanner } from '@prisma/client'

interface HeroCarouselProps {
  banners: HomePageBanner[]
}

const AUTOPLAY_INTERVAL = 6000; // 6 segundos

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play effect
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [banners, currentIndex]);

  if (!banners || banners.length === 0) {
    return (
        <div className="w-full h-[100dvh] bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
            <p className="text-muted-foreground text-xl">Nenhum banner ativo no momento.</p>
        </div>
    )
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // Variantes para a animação de "Gota" (Ripple/Clip-path Fade)
  const dropVariants = {
    initial: { 
        clipPath: "circle(0% at 50% 50%)", 
        opacity: 0,
        zIndex: 10 
    },
    animate: { 
        clipPath: "circle(150% at 50% 50%)", 
        opacity: 1,
        zIndex: 10,
        transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } 
    },
    exit: { 
        zIndex: 0,
        transition: { duration: 0.5 } // Fica por baixo enquanto o novo cresce
    }
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      
      {/* Gradiente sutil no topo para garantir legibilidade da Navbar Transparente */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/70 to-transparent z-20 pointer-events-none" />
      
      {/* Imagens do Banner com Animação */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentBanner.id}
          variants={dropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={currentBanner.imageUrl}
            alt={currentBanner.title || 'Banner promocional'}
            fill
            priority
            quality={90}
            className="object-cover"
          />
          {/* Película escura inferior para o texto do banner */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Conteúdo do Banner */}
          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 md:p-16 lg:p-24 flex flex-col justify-end h-full text-white">
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="max-w-4xl"
            >
              {currentBanner.title && (
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-2xl mb-4 sm:mb-6">
                  {currentBanner.title}
                </h1>
              )}
              {currentBanner.linkUrl && (
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Link href={currentBanner.linkUrl}>Descubra Mais</Link>
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles de Navegação (visíveis apenas em telas maiores e se houver mais de 1 banner) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 h-14 w-14 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
            aria-label="Banner Anterior"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button 
            onClick={handleNext}
            className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 h-14 w-14 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
            aria-label="Próximo Banner"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 transition-all duration-500 rounded-full ${
                  index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
