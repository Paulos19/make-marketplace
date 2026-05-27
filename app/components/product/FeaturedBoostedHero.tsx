'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Prisma } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Play, Sparkles } from 'lucide-react'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

interface FeaturedBoostedHeroProps {
  products: ProductWithDetails[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function FeaturedBoostedHero({ products }: FeaturedBoostedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Rotate every 15 seconds
  useEffect(() => {
    if (products.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, 15000)
    
    return () => clearInterval(interval)
  }, [products.length])

  if (!products || products.length === 0) return null;

  const currentProduct = products[currentIndex];
  const imageSrc = currentProduct.images?.[0] || '/img-placeholder.png';
  const url = currentProduct.isService ? `/services/${currentProduct.id}` : `/products/${currentProduct.id}`;

  return (
    <div className="w-full relative bg-[#050505] h-[100dvh] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Imagem de Fundo (Cover) */}
          <Image
            src={imageSrc}
            alt={currentProduct.name}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          
          {/* Gradientes Premium estilo Netflix */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/40 to-transparent" />
          <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />

          {/* Conteúdo sobreposto */}
          <div className="absolute bottom-0 left-0 w-full pb-16 sm:pb-24 px-6 sm:px-10 lg:px-16 flex flex-col justify-end">
            <div className="max-w-3xl">
              
              {/* Badge Turbinado */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md mb-4"
              >
                <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                Patrocinado
              </motion.div>
              
              {/* Título do Produto */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-[1.1] drop-shadow-lg"
              >
                {currentProduct.name}
              </motion.h1>
              
              {/* Preço e Vendedor */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80 text-sm sm:text-base font-medium mb-6"
              >
                <span className="text-white font-black bg-white/10 px-3 py-1 rounded-md backdrop-blur-md">
                  {currentProduct.priceType === 'ON_BUDGET' ? 'Sob consulta' : formatCurrency(currentProduct.price || 0)}
                </span>
                {currentProduct.user?.storeName && (
                  <span className="opacity-70">• por {currentProduct.user.storeName}</span>
                )}
              </motion.div>

              {/* Descrição Curta (Opcional) */}
              {currentProduct.description && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-white/60 text-sm sm:text-base mb-8 line-clamp-2 max-w-xl font-light"
                >
                  {currentProduct.description}
                </motion.p>
              )}
              
              {/* Ações */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-4"
              >
                <Button asChild size="lg" className="rounded-full h-12 sm:h-14 px-8 sm:px-10 bg-white text-black hover:bg-white/90 font-bold text-sm sm:text-base shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300">
                    <Link href={url}>
                        <Play className="mr-2 w-5 h-5 fill-current" /> Ver Agora
                    </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de Paginação */}
      {products.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-10 lg:right-16 z-20 flex gap-2">
            {products.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 sm:w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 sm:w-3 bg-white/30 hover:bg-white/50'}`}
                    aria-label={`Ir para o destaque ${idx + 1}`}
                />
            ))}
        </div>
      )}
    </div>
  )
}
