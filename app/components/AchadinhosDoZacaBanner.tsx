'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText } from 'lucide-react';
import type { Product as PrismaProduct, User } from '@prisma/client';

interface UserInfo {
  id: string;
  name?: string | null;
  whatsappLink?: string | null;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images: string[];
  user: UserInfo;
  originalPrice?: number | null;
  onPromotion?: boolean | null | undefined; // << ESTA É A LINHA CORRIGIDA
  categories?: { id: string; name: string }[];
  createdAt?: string;
}

interface AchadinhosDoZacaBannerProps {
  products: Product[];
  isLoading?: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function AchadinhosDoZacaBanner({ products, isLoading }: AchadinhosDoZacaBannerProps) {
  // O banner agora destaca apenas o primeiro produto da lista recebida
  const featuredProduct = products && products.length > 0 ? products[0] : null;

  if (isLoading) {
    // Skeleton que ocupa a tela inteira para uma transição suave
    return <Skeleton className="w-full h-screen" />;
  }

  // Se não houver produtos, exibe um banner de fallback
  if (!featuredProduct || !featuredProduct.user) {
    return (
      <section className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-zaca-lilas via-zaca-roxo to-zaca-azul text-white p-4">
        <div className="text-center">
          <h2 className="text-5xl font-bangers tracking-wider drop-shadow-lg">Bem-vindo ao Zacaplace!</h2>
          <p className="mt-2 text-lg">O seu lugar para encontrar os melhores achadinhos.</p>
        </div>
      </section>
    );
  }
  
  // Garante que temos uma imagem para exibir, ou usa um placeholder seguro
  const firstImage = (featuredProduct.images && featuredProduct.images.length > 0)
    ? featuredProduct.images[0]
    : 'https://placehold.co/1920x1080/EEE/31343C?text=Zaca';

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      // CORREÇÃO PRINCIPAL: O container agora tem h-screen para ocupar exatamente a altura da tela, eliminando o scroll.
      className="relative h-screen w-full flex flex-col justify-end text-white overflow-hidden"
    >
      {/* Imagem de Fundo */}
      <div className="absolute inset-0 z-0">
        <Image
          src={firstImage}
          alt={`Fundo promocional de ${featuredProduct.name}`}
          fill
          className="object-cover"
          priority // A imagem do banner é a mais importante, deve carregar primeiro
          quality={80}
        />
        {/* Overlay para garantir a legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Conteúdo do Hero */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <motion.div
          variants={fadeInUp}
          className="max-w-2xl text-center md:text-left"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bangers tracking-tight filter drop-shadow-lg">
            {featuredProduct.name}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200/90 line-clamp-3 leading-relaxed">
            {featuredProduct.description || "Um achadinho incrível selecionado pelo Zaca, confira mais detalhes!"}
          </p>
          <div className="mt-4">
            {featuredProduct.onPromotion && featuredProduct.originalPrice && (
              <span className="text-xl text-slate-400 line-through mr-3">
                R$ {featuredProduct.originalPrice.toFixed(2)}
              </span>
            )}
            <span className={`text-3xl sm:text-4xl font-extrabold ${featuredProduct.onPromotion ? 'text-zaca-vermelho' : 'text-white'}`}>
              R$ {featuredProduct.price.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center md:justify-start">
            <Button asChild size="lg" className="bg-white text-zaca-roxo hover:bg-slate-200 font-bold shadow-lg">
              <Link href={`/products/${featuredProduct.id}`}>Ver Detalhes</Link>
            </Button>
            {featuredProduct.user.whatsappLink && (
              <Button asChild size="lg" variant="outline" className="border-white text-white bg-white/10 hover:bg-white/20">
                <a href={featuredProduct.user.whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageSquareText className="mr-2 h-5 w-5" /> Fale com o Vendedor
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
