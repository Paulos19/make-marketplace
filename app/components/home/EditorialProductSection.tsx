'use client'

import { Prisma } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import { MiniProductCard } from '@/app/components/product/MiniProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight, Rocket, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>

const transformProductForClient = (product: ProductWithDetails) => {
  return {
    ...product,
    categories: product.category ? [product.category] : [],
    createdAt: new Date(product.createdAt).toISOString(),
    updatedAt: new Date(product.updatedAt).toISOString(),
  }
}

interface EditorialProductSectionProps {
  title: string
  products: ProductWithDetails[]
  viewAllLink: string
  isTurbinado?: boolean
}

// Definição de paletas harmônicas (Colorimetria Profissional)
const palettes = [
  { id: 'electric-lime', bg: 'bg-indigo-600 dark:bg-indigo-900', text: 'text-lime-300', title: 'text-white', blob: 'bg-yellow-400', btn: 'bg-lime-400 hover:bg-lime-500 text-indigo-950' },
  { id: 'violet-peach', bg: 'bg-violet-900', text: 'text-peach-300 text-[#FFDAB9]', title: 'text-white', blob: 'bg-emerald-400', btn: 'bg-[#FFDAB9] hover:bg-[#FFC0CB] text-violet-950' },
  { id: 'coral-cream', bg: 'bg-rose-500 dark:bg-rose-900', text: 'text-orange-100', title: 'text-white', blob: 'bg-purple-400', btn: 'bg-orange-100 hover:bg-white text-rose-700' },
  { id: 'mint-forest', bg: 'bg-teal-700 dark:bg-teal-950', text: 'text-yellow-200', title: 'text-white', blob: 'bg-orange-400', btn: 'bg-yellow-300 hover:bg-yellow-400 text-teal-950' },
  { id: 'amber-indigo', bg: 'bg-amber-500 dark:bg-amber-700', text: 'text-indigo-900 dark:text-indigo-100', title: 'text-indigo-950 dark:text-white', blob: 'bg-rose-400', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
];

export function EditorialProductSection({ title, products, viewAllLink, isTurbinado = false }: EditorialProductSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);

  useEffect(() => {
    // Escolhe uma paleta aleatória no carregamento do cliente
    setPaletteIndex(Math.floor(Math.random() * palettes.length));
    setMounted(true);
  }, []);

  if (products.length === 0) return null;

  const currentPalette = palettes[paletteIndex];

  // O primeiro produto é o Destaque
  const featuredProduct = products[0];
  // Pegamos até 6 produtos para a grade secundária
  const secondaryProducts = products.slice(1, 7);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Prevenir hidration mismatch renderizando um placeholder vazio
  if (!mounted) {
    return <div className="w-full h-96 rounded-[3rem] bg-slate-100 dark:bg-slate-800 animate-pulse my-8"></div>;
  }

  const featuredImage = featuredProduct.images && featuredProduct.images.length > 0 ? featuredProduct.images[0] : '/img-placeholder.png';
  const featuredUrl = featuredProduct.isService ? `/services/${featuredProduct.id}` : `/products/${featuredProduct.id}`;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ staggerChildren: 0.1 }}
      className={cn("w-full relative overflow-hidden shadow-2xl py-12 sm:py-16 md:py-20", currentPalette.bg)}
    >
      {/* Decoração Orgânica de Fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-16">

        {/* BLOCO ESQUERDO: Título + Destaque (Featured Product) */}
        <div className="w-full lg:w-5/12 flex flex-col justify-between">
          <motion.div variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}>
            {isTurbinado && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/30 text-white font-bold animate-pulse">
                <Rocket className="w-5 h-5" />
                <span>Sessão Turbinada</span>
              </div>
            )}
            <h2 className={cn("text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-4", currentPalette.title)}>
              {title.split(' ').map((word, i) => (
                <span key={i} className={i % 2 === 1 ? currentPalette.text : ''}>{word} </span>
              ))}
            </h2>
            <p className="text-white/80 font-medium text-lg mb-8 max-w-md">
              {isTurbinado
                ? "Os anúncios que estão a voar! Mais vistos, mais desejados e com mais destaque na praça."
                : "Descubra os melhores itens da sua cidade. O estilo que você procura está aqui."
              }
            </p>
            <Button asChild size="lg" className={cn("rounded-full font-bold shadow-lg transition-transform hover:scale-105 mb-12", currentPalette.btn)}>
              <Link href={viewAllLink}>
                Explorar Tudo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Featured Product Card */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="relative group mt-auto">
            {/* Blob Decorativo Atrás da Foto */}
            <div className={cn("absolute -top-6 -right-6 w-32 h-32 rounded-full mix-blend-multiply blur-xl opacity-70 transition-transform group-hover:scale-150 duration-700", currentPalette.blob)}></div>
            <div className={cn("absolute -bottom-8 -left-8 w-40 h-40 rounded-full mix-blend-multiply blur-xl opacity-70 transition-transform group-hover:scale-150 duration-700", currentPalette.blob)}></div>

            <Link href={featuredUrl} className="block relative z-10 w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2rem] border-4 border-white/20 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
              <Image
                src={featuredImage}
                alt={featuredProduct.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              <div className="absolute bottom-0 left-0 p-6 w-full text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:text-primary-foreground transition-colors">{featuredProduct.name}</h3>
                    <p className="text-white/70 text-sm font-medium">{featuredProduct?.user?.storeName || featuredProduct?.user?.name || "Vendedor Local"}</p>
                  </div>
                  <div className="shrink-0 bg-white text-black px-4 py-2 rounded-xl font-black text-xl shadow-xl">
                    {featuredProduct.priceType === 'ON_BUDGET' ? 'A combinar' : formatCurrency(featuredProduct.price || 0)}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* BLOCO DIREITO: Grade Secundária (Mini Products) */}
        <div className="w-full lg:w-7/12 flex items-center">
          {secondaryProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
              {secondaryProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[3/4] sm:aspect-auto"
                >
                  <MiniProductCard product={transformProductForClient(product as any) as any} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-[2rem] text-white/50">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Mais produtos em breve</p>
            </div>
          )}
        </div>

      </div>
    </motion.section>
  )
}
