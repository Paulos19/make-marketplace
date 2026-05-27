'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, UserPlus, Cloud } from 'lucide-react'
import { useState, useEffect } from 'react'

export function HomeCtaSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <section className="h-96 bg-slate-100 dark:bg-slate-900 animate-pulse"></section>
  }

  return (
    <section className="relative overflow-hidden py-24 w-full flex items-center justify-center">
      
      {/* Fundo Dinâmico Animado (Gradiente Suave) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900"></div>

      {/* Blobs flutuantes animados com Framer Motion */}
      <motion.div 
        animate={{ 
            x: [0, 50, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-10 w-96 h-96 bg-blue-200/40 dark:bg-blue-800/20 rounded-full blur-3xl"
      />
      
      <motion.div 
        animate={{ 
            x: [0, -40, 0], 
            y: [0, 60, 0],
            scale: [1, 1.3, 1] 
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-10 left-10 w-80 h-80 bg-purple-200/40 dark:bg-purple-800/20 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Imagem com Efeito de Flutuação (Hover) */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center relative"
          >
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                <Image 
                    src="/zacanuvem.png" 
                    alt="Conecte-se com Sete Lagoas" 
                    width={600} 
                    height={600} 
                    className="mx-auto w-full max-w-lg lg:max-w-xl drop-shadow-2xl" 
                />
            </motion.div>
          </motion.div>

          {/* Conteúdo de Texto e Botões */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-center lg:text-left flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/50 w-fit mx-auto lg:mx-0 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm">
                <Cloud className="w-5 h-5 fill-current" />
                <span>O Marketplace da Cidade</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zaca-roxo to-indigo-600 dark:from-indigo-400 dark:to-purple-400 leading-tight tracking-tighter mb-6">
              CONECTE-SE COM<br/>SETE LAGOAS
            </h2>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              O céu é o limite! Cadastre-se para começar a vender para milhares de clientes ou descubra os melhores achadinhos e serviços da nossa cidade.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Button asChild size="lg" className="rounded-full h-14 px-8 bg-zaca-magenta hover:bg-pink-600 text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:scale-105 transition-transform">
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-5 w-5" />
                  QUERO VENDER
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 border-2 border-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:scale-105 transition-transform shadow-lg">
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  QUERO COMPRAR
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
