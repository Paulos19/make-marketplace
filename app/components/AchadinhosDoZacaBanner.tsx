"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquareText, User as UserIcon, ShoppingCart, ChevronDown } from 'lucide-react';

// Interfaces (mantenha consistentes com app/page.tsx)
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
  imageUrls: string[];
  user: UserInfo;
  originalPrice?: number | null;
  onPromotion?: boolean | null | undefined; // << ESTA É A LINHA CORRIGIDA
  categories?: { id: string; name: string }[];
  createdAt?: string;
}

interface AchadinhosDoZacaBannerProps {
  products: Product[]; // Todos os produtos para o banner e a primeira fila
  isLoading?: boolean;
}

// Card para o carrossel secundário (fila de produtos)
const AchadinhoCardMini = ({ product }: { product: Product }) => (
  <Card className="group relative flex flex-col h-full overflow-hidden rounded-md shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
    <Link href={`/products/${product.id}`} className="block aspect-video w-full relative" aria-label={product.name}>
      <Image
        src={product.imageUrls[0] || '/img-placeholder.png'}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
      {product.onPromotion && (
        <div className="absolute top-2 right-2 bg-zaca-vermelho text-white text-xs font-semibold px-2 py-0.5 rounded-sm shadow-md">
          PROMO
        </div>
      )}
    </Link>
    <CardContent className="p-2.5 flex-grow">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate group-hover:text-zaca-roxo transition-colors">
        <Link href={`/products/${product.id}`}>{product.name}</Link>
      </h4>
      <div>
        {product.onPromotion && product.originalPrice && (
          <span className="text-xs text-slate-500 dark:text-slate-400 line-through mr-1.5">
            R$ {product.originalPrice.toFixed(2)}
          </span>
        )}
        <span className={`text-sm font-bold ${product.onPromotion ? 'text-zaca-vermelho' : 'text-slate-900 dark:text-slate-50'}`}>
          R$ {product.price.toFixed(2)}
        </span>
      </div>
    </CardContent>
    {/* Botões podem ser adicionados aqui se necessário para os cards do carrossel,
        mas a inspiração da Netflix geralmente não tem botões diretos nos cards da fila,
        eles aparecem ao passar o mouse ou em um modal. Para simplificar, omitirei por ora. */}
  </Card>
);


export default function AchadinhosDoZacaBanner({ products, isLoading }: AchadinhosDoZacaBannerProps) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };
  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const mainFeaturedProduct = products && products.length > 0 ? products[0] : null;
  const productQueue = products && products.length > 1 ? products.slice(1) : []; // Produtos para a primeira fila

  if (isLoading && !mainFeaturedProduct) {
    // Skeleton para o hero banner
    return (
      <div className="relative min-h-[70vh] sm:min-h-[80vh] flex flex-col justify-end p-6 sm:p-10 md:p-12 bg-slate-800 text-white animate-pulse">
        <div className="absolute inset-0 bg-slate-700/50 blur-sm"></div>
        <div className="relative z-10 max-w-screen-xl mx-auto w-full">
            <div className="md:flex md:items-end md:gap-8">
                <div className="md:w-1/3 lg:w-1/4 xl:w-1/5 mb-6 md:mb-0 flex-shrink-0">
                    <div className="aspect-[2/3] bg-slate-600 rounded-lg shadow-2xl"></div> {/* Placeholder Imagem */}
                </div>
                <div className="md:w-2/3 lg:w-3/4 xl:w-4/5 space-y-4">
                    <div className="h-10 bg-slate-500 rounded w-3/4"></div> {/* Nome Produto */}
                    <div className="h-5 bg-slate-500 rounded w-full"></div> {/* Descrição */}
                    <div className="h-5 bg-slate-500 rounded w-5/6"></div> {/* Descrição */}
                    <div className="h-8 bg-slate-500 rounded w-1/3 mt-2"></div> {/* Preço */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="h-11 bg-slate-400 rounded-md flex-1"></div> {/* Botão 1 */}
                        <div className="h-11 bg-slate-400 rounded-md flex-1"></div> {/* Botão 2 */}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (!mainFeaturedProduct) {
    // Fallback se não houver produtos para o banner principal
    return (
      <section className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-zaca-lilas via-zaca-roxo to-zaca-azul text-white p-8 text-center">
        <div className="relative z-10">
          <motion.h2
            variants={fadeInUp} initial="hidden" animate="visible"
            className="text-4xl sm:text-5xl font-bangers mb-6 tracking-wider filter drop-shadow-lg"
          >
            Achadinhos do Zaca
          </motion.h2>
          <motion.p className="text-lg sm:text-xl mb-8" variants={fadeInUp} transition={{ delay: 0.2 }}>
            Ô psit! Nenhum achadinho em destaque no momento. O Zaca já volta!
          </motion.p>
        </div>
      </section>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Seção Hero - Produto Principal em Destaque */}
      <section
        className="relative min-h-[70vh] sm:min-h-[80vh] w-full flex flex-col justify-end text-white overflow-hidden"
        // Opcional: Adicionar padding geral se necessário, ex: pb-12 pt-20
      >
        {/* Imagem de Fundo */}
        <div className="absolute inset-0 z-0">
          <Image
            src={mainFeaturedProduct.imageUrls[0] || '/img-placeholder.png'}
            alt={`Fundo promocional de ${mainFeaturedProduct.name}`}
            fill
            className="object-cover blur-sm scale-105" // Efeito de blur leve no fundo
            priority
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/40 md:to-transparent"></div>
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <motion.div variants={fadeInUp} className="md:flex md:items-end md:gap-6 lg:gap-10 max-w-screen-xl mx-auto">
            {/* Imagem do Produto à Esquerda */}
            <div className="w-full md:w-2/5 lg:w-1/3 xl:w-1/4 flex-shrink-0 mb-6 md:mb-0">
              <Link href={`/products/${mainFeaturedProduct.id}`} aria-label={mainFeaturedProduct.name} className="block">
                <Image
                  src={mainFeaturedProduct.imageUrls[0] || '/img-placeholder.png'}
                  alt={mainFeaturedProduct.name}
                  width={350} // Ajuste conforme necessário
                  height={525} // Mantendo proporção ~2:3 ou ajuste
                  className="rounded-lg shadow-2xl object-cover w-full h-auto max-h-[70vh] transition-all duration-300 ease-in-out hover:scale-105 mx-auto md:mx-0"
                />
              </Link>
            </div>

            {/* Informações e Botões à Direita */}
            <div className="w-full md:w-3/5 lg:w-2/3 xl:w-3/4 text-center md:text-left space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight line-clamp-2 filter drop-shadow-md">
                <Link href={`/products/${mainFeaturedProduct.id}`} className="hover:text-zaca-lilas/90 transition-colors">
                  {mainFeaturedProduct.name}
                </Link>
              </h1>
              <p className="text-sm sm:text-base text-slate-200/90 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-2xl mx-auto md:mx-0">
                {mainFeaturedProduct.description || "Um achadinho incrível selecionado pelo Zaca, confira mais detalhes!"}
              </p>
              <div className="pt-1 sm:pt-2">
                {mainFeaturedProduct.onPromotion && mainFeaturedProduct.originalPrice && (
                  <span className="text-lg text-slate-400 line-through mr-2">
                    R$ {mainFeaturedProduct.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className={`text-3xl sm:text-4xl font-extrabold ${mainFeaturedProduct.onPromotion ? 'text-zaca-vermelho' : 'text-white'}`}>
                  R$ {mainFeaturedProduct.price.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-3 justify-center md:justify-start">
                {mainFeaturedProduct.user?.whatsappLink && (
                  <Button
                    asChild size="lg"
                    className="bg-btn-fale-vendedor text-btn-fale-vendedor-foreground hover:bg-btn-fale-vendedor-hover focus-visible:ring-btn-fale-vendedor text-base shadow-lg"
                  >
                    <a href={mainFeaturedProduct.user.whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageSquareText className="mr-2 h-5 w-5" /> Fale com Vendedor
                    </a>
                  </Button>
                )}
                {mainFeaturedProduct.user && (
                  <Button
                    asChild variant="outline" size="lg"
                    className="border-zaca-lilas text-zaca-lilas bg-white/10 hover:bg-white/20 hover:border-white hover:text-white focus-visible:ring-zaca-lilas text-base shadow-lg"
                  >
                    <Link href={`/seller/${mainFeaturedProduct.user.id}`}>
                      <UserIcon className="mr-2 h-5 w-5" /> Ver Perfil do Zaca
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fila de Produtos - "Mais Achadinhos do Zaca" */}
      {productQueue.length > 0 && (
        <motion.section
          variants={fadeInUp}
          className="py-10 md:py-12 bg-slate-100 dark:bg-slate-950" // Fundo diferente para a fila
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bangers text-center sm:text-left mb-6 text-zaca-roxo dark:text-zaca-lilas tracking-wide">
              Mais Achadinhos do Zaca
            </h2>
            <Carousel
              opts={{ align: "start", slidesToScroll: 'auto', containScroll: 'trimSnaps' }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {productQueue.map((product) => (
                  <CarouselItem key={product.id} className="pl-3 md:pl-4 basis-[60%] sm:basis-[40%] md:basis-[30%] lg:basis-[23%] xl:basis-[18%]">
                    <AchadinhoCardMini product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 shadow-md" />
              <CarouselNext className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 shadow-md" />
            </Carousel>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}