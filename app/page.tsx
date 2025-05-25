"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image'; // Importação do next/image
import { motion } from 'framer-motion';

// Componentes Shadcn/ui (ajuste os caminhos se o diretório @/components estiver diferente)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Seus componentes Navbar e Footer
// Certifique-se que estes caminhos estão corretos em relação à localização deste page.tsx
// Se page.tsx está em app/page.tsx, então os componentes estariam em app/components/layout/
import Navbar from './components/layout/Navbar'; 
import Footer from './components/layout/Footer';

// Ícones (opcional)
import { ShoppingCart, Zap, Gift, AlertTriangle, PackageOpen } from 'lucide-react'; // Adicionados ícones para estados de erro/vazio
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[]; // Usado para produtos, podem ser URLs externas ou locais
  userId: string;
  // Adicione createdAt se for usar para ordenar "Adicionados Recentemente"
  createdAt?: string | Date; 
  // Adicione onPromotion e originalPrice se for usar para a seção "Em Promoção"
  onPromotion?: boolean;
  originalPrice?: number;
  // Adicione categories se for usar para "Produtos por Categoria"
  categories?: { id: string; name: string }[];
}

// Configurações para animações do Framer Motion
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Componente ProductCard para reutilização (exemplo simplificado)
// Você pode ter um ProductCard mais elaborado em um arquivo separado
const ProductCardDisplay = ({ product }: { product: Product }) => (
  <motion.div
    variants={itemVariants}
    className="h-full" // Para garantir que o Card ocupe o espaço do motion.div
  >
    <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col dark:bg-gray-800">
      <CardHeader className="p-0">
        <div className="relative w-full aspect-[4/3]"> {/* Proporção da imagem */}
          <Image
            src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/img-placeholder.png'} // Tenha um /public/img-placeholder.png
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105" // Efeito de zoom no hover do Link pai
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="text-lg font-semibold mb-1 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{product.name}</CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex-grow line-clamp-2">
          {product.description ? product.description : 'Veja mais detalhes sobre este produto.'}
        </CardDescription>
        <p className="text-xl font-bold text-sky-600 dark:text-sky-500 mt-auto">R$ {product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-2 border-t dark:border-gray-700/50">
         <Button asChild className="w-full bg-gray-800 hover:bg-black dark:bg-sky-600 dark:hover:bg-sky-700 text-white">
           <Link href={`/products/${product.id}`}>Ver Detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);


export default function HomePage() {
  const { data: session, status } = useSession();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // ATUALIZADO: Usando imagens locais da pasta /public para o carrossel
  const carouselImages = ['/1.jpg', '/2.jpg', '/3.jpg'];
  // CERTIFIQUE-SE QUE AS IMAGENS 1.jpg, 2.jpg, 3.jpg ESTÃO NA PASTA /public DO SEU PROJETO

  useEffect(() => {
    const fetchRecentProducts = async () => {
      setIsLoadingProducts(true);
      setProductError(null);
      try {
        const response = await fetch('/api/products?limit=4&sort=createdAt:desc'); // Exemplo: buscar 4 mais recentes
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Falha ao buscar produtos recentes');
        }
        const data = await response.json();
        // Certifique-se que 'data' é um array de produtos
        setRecentProducts(Array.isArray(data) ? data : (data.products && Array.isArray(data.products) ? data.products : []));
      } catch (err) {
        setProductError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
        console.error(err);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchRecentProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <Navbar />

      <main className="flex-grow">
        {/* Seção 1: Carrossel de Imagens Principal */}
        <motion.section
          className="relative w-full h-[calc(70vh)] sm:h-[calc(80vh)] md:h-[calc(90vh)] lg:h-screen overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={{ visible: { opacity: 1, transition: { duration: 0.5 }}, hidden: { opacity: 0 } }}
        >
          <Carousel
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
            className="w-full h-full"
            opts={{ loop: true }}
          >
            <CarouselContent className="h-full">
              {carouselImages.map((src, index) => (
                <CarouselItem key={index} className="h-full">
                  <div className="relative w-full h-full">
                    <Image
                      src={src} // Caminho local agora
                      alt={`Banner Promocional MakeStore ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="100vw" // Simplificado, pois é background
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col items-center justify-end text-center p-8 pb-12 sm:pb-16 md:pb-20">
                      <motion.h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white drop-shadow-lg leading-tight"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                      >
                        Descubra a Beleza em Você
                      </motion.h1>
                      <motion.p
                        className="mt-4 text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl drop-shadow-md"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      >
                        Produtos incríveis para realçar o seu brilho natural. Qualidade e variedade em um só lugar!
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="mt-8"
                      >
                        <Button size="lg" asChild className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-6 rounded-full shadow-lg transform hover:scale-105 transition-transform">
                          <Link href="/products">Ver Coleção</Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 text-gray-800 dark:text-white disabled:opacity-0 transition-opacity" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 text-gray-800 dark:text-white disabled:opacity-0 transition-opacity" />
          </Carousel>
        </motion.section>

        {/* Seção 2: Destaques / Imagem com Texto */}
        <motion.section
          className="py-16 lg:py-24 bg-white dark:bg-gray-900"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={itemVariants} className="rounded-lg overflow-hidden shadow-xl aspect-video md:aspect-[4/3]">
                 {/* Use uma das suas imagens locais aqui também, ou um placeholder diferente */}
                <Image src="/2.jpg" alt="Destaque Maquiagem MakeStore" width={600} height={450} className="object-cover w-full h-full" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Zap className="w-12 h-12 text-sky-500 mb-4" />
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-800 dark:text-white">Novidades que Inspiram</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Explore lançamentos exclusivos e as últimas tendências do mundo da beleza. Produtos selecionados para você brilhar em qualquer ocasião.
                </p>
                <Button size="lg" asChild className="bg-transparent hover:bg-sky-500 text-sky-600 hover:text-white border-2 border-sky-500 dark:text-sky-400 dark:border-sky-400 dark:hover:bg-sky-500 dark:hover:text-white transition-all">
                  <Link href="/products?category=novidades">Ver Novidades</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Seção 3: Produtos Recentes */}
        <motion.section
          className="py-16 lg:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Gift className="w-16 h-16 text-sky-500 mx-auto mb-4" />
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">Adicionados Recentemente</h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Confira os últimos produtos que chegaram em nossa loja.</p>
            </div>
            {isLoadingProducts ? (
              // Skeleton para produtos recentes
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden shadow-lg dark:bg-gray-800">
                    <Skeleton className="w-full h-56" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-8 w-1/3 rounded mt-1" />
                      <Skeleton className="h-10 w-full rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productError ? (
              <div className="text-center py-10 text-red-500 dark:text-red-400">
                <AlertTriangle className="mx-auto h-12 w-12 mb-3" />
                <p className="font-semibold">Erro ao carregar produtos recentes.</p>
                <p className="text-sm">{productError}</p>
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <PackageOpen className="mx-auto h-16 w-16 mb-4"/>
                <p className="text-xl">Nenhum produto recente para mostrar no momento.</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {recentProducts.map((product) => (
                  <ProductCardDisplay key={product.id} product={product} />
                ))}
              </motion.div>
            )}
            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-sky-600 hover:bg-sky-700 text-white text-lg px-10 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                <Link href="/products">Ver Todos os Produtos</Link>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Seção 4: Outra Imagem com Texto (alternando lado) */}
        <motion.section
          className="py-16 lg:py-24 bg-white dark:bg-gray-900"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={itemVariants} className="md:order-2 rounded-lg overflow-hidden shadow-xl aspect-video md:aspect-[4/3]">
                 {/* Use uma das suas imagens locais aqui também, ou um placeholder diferente */}
                 <Image src="/3.jpg" alt="Destaque Cuidados com a Pele MakeStore" width={600} height={450} className="object-cover w-full h-full" />
              </motion.div>
              <motion.div variants={itemVariants} className="md:order-1">
                <ShoppingCart className="w-12 h-12 text-sky-500 mb-4" />
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-800 dark:text-white">Qualidade que Você Confia</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Selecionamos apenas os melhores produtos, de marcas renomadas e com ingredientes que cuidam de você. Sua satisfação é nossa prioridade.
                </p>
                <Button size="lg" asChild className="bg-transparent hover:bg-sky-500 text-sky-600 hover:text-white border-2 border-sky-500 dark:text-sky-400 dark:border-sky-400 dark:hover:bg-sky-500 dark:hover:text-white transition-all">
                  <Link href="/about">Nossa História</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}