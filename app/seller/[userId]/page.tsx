// app/seller/[userId]/page.tsx (ou o caminho correto)
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter para navegação
import Link from 'next/link';
import Image from 'next/image'; // Importar next/image
import { motion } from 'framer-motion';

// Componentes Shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // Para loading
import { Separator } from '@/components/ui/separator';

// Ícones Lucide
import { Phone, ShoppingBag, Store, UserCircle2, PackageOpen, AlertTriangle, MessageSquareText, ChevronRight } from 'lucide-react';

// Seus componentes Navbar e Footer (caminhos de exemplo)
import Navbar from '@/app/components/layout/Navbar'; // Ajuste o caminho se necessário
import Footer from '@/app/components/layout/Footer'; // Ajuste o caminho se necessário

// Interfaces (mantidas do seu código)
interface SellerCategory {
  id: string;
  name: string;
}

interface SellerProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  onPromotion?: boolean | null;
  imageUrls: string[];
  categories: SellerCategory[];
  createdAt: string;
}

interface SellerProfile {
  id: string;
  name?: string | null;
  image?: string | null;
  whatsappLink?: string | null;
  profileDescription?: string | null;
  Product: SellerProduct[]; // Note que a API parece retornar 'Product' com 'P' maiúsculo
}


// --- ProductCard Aprimorado ---
const ProductCard = ({ product }: { product: SellerProduct }) => (
  <motion.div
    variants={itemVariants}
    className="h-full"
  >
    <Link href={`/products/${product.id}`} className="block group focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 rounded-lg" aria-label={`Ver detalhes de ${product.name}`}>
      <Card className="h-full flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ease-in-out dark:bg-gray-800/70 dark:border-gray-700/80 dark:hover:border-sky-600/70 transform group-hover:scale-[1.03]">
        <CardHeader className="p-0 relative border-b dark:border-gray-700/50">
          <div className="aspect-[4/3] w-full relative bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
            <Image
              src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/img-placeholder.png'} // Tenha um /public/img-placeholder.png
              alt={`Imagem de ${product.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
          {product.onPromotion && (
            <Badge
              variant="destructive"
              className="absolute top-2.5 right-2.5 bg-red-500 hover:bg-red-600 text-white shadow-md px-2.5 py-1 text-xs font-semibold border-none"
            >
              PROMO!
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-1.5">
          <h3 className="text-md font-semibold leading-snug mb-1 truncate text-gray-800 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {product.name}
          </h3>
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.categories.slice(0, 2).map(category => (
                <Badge key={category.id} variant="secondary" className="text-xs px-1.5 py-0.5 dark:bg-gray-700 dark:text-gray-300">{category.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-1 border-t dark:border-gray-700/50 mt-auto bg-gray-50/30 dark:bg-gray-800/40">
          <div>
            {product.onPromotion && product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                R$ {product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className={`font-bold text-lg ${product.onPromotion ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-gray-50'}`}>
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  </motion.div>
);

// --- Skeleton para ProductCard ---
const ProductCardSkeleton = () => (
  <Card className="h-full flex flex-col dark:bg-gray-800/70 dark:border-gray-700/80">
    <CardHeader className="p-0 relative">
      <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
    </CardHeader>
    <CardContent className="flex-grow p-4 space-y-3">
      <Skeleton className="h-5 w-3/4 rounded" />
      <div className="flex gap-2"><Skeleton className="h-5 w-1/4 rounded-full" /><Skeleton className="h-5 w-1/3 rounded-full" /></div>
    </CardContent>
    <CardFooter className="p-4 pt-0 mt-auto">
      <div className="w-full space-y-1">
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-7 w-1/3 rounded" />
      </div>
    </CardFooter>
  </Card>
);

// Animações Framer Motion
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const productListVariants = {
  visible: { transition: { staggerChildren: 0.07 } },
  hidden: {},
};

// --- Componente da Página de Perfil do Vendedor ---
export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchSellerProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/seller/${userId}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Falha ao buscar perfil do vendedor');
          }
          const data = await response.json();
          setSeller(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSellerProfile();
    } else {
        setError("ID do vendedor não especificado.");
        setIsLoading(false);
    }
  }, [userId]);

  const getAvatarFallback = (name?: string | null) => {
    if (name) {
      const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 className="h-10 w-10"/>;
    }
    return <UserCircle2 className="h-10 w-10"/>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto p-4 md:p-8 animate-pulse">
          <header className="mb-10 p-6 sm:p-8 bg-white dark:bg-gray-800/50 shadow-lg rounded-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <Skeleton className="w-28 h-28 md:w-36 md:h-36 rounded-full shrink-0" />
            <div className="flex-1 space-y-3 text-center md:text-left">
              <Skeleton className="h-10 w-3/4 md:w-1/2 rounded-md" />
              <Skeleton className="h-5 w-full md:w-3/4 rounded-md" />
              <Skeleton className="h-5 w-full md:w-2/3 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-lg mt-2" />
            </div>
          </header>
          <section>
            <Skeleton className="h-8 w-1/3 mb-8 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
       <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-center p-4">
          <div>
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4"/>
            <h1 className="text-2xl font-semibold text-red-600 mb-2">Erro ao Carregar Perfil</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
            <Button onClick={() => router.back()} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Voltar</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-center p-4">
          <div>
            <UserCircle2 className="mx-auto h-16 w-16 text-gray-400 mb-4"/>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Vendedor Não Encontrado</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Não foi possível encontrar informações para este vendedor.</p>
            <Button onClick={() => router.push('/')} className="bg-sky-600 hover:bg-sky-700 text-white">Página Inicial</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <motion.div 
        className="flex-grow"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Seção de Cabeçalho/Banner do Vendedor */}
        <motion.header 
          variants={headerVariants}
          className="bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 dark:from-sky-700 dark:via-indigo-700 dark:to-purple-800 text-white py-12 sm:py-16 md:py-20"
        >
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <motion.div variants={itemVariants} className="shrink-0">
                <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white/50 shadow-xl">
                  <AvatarImage src={seller.image || undefined} alt={seller.name || 'Foto do Vendedor'} />
                  <AvatarFallback className="text-4xl md:text-5xl bg-white/20 text-white">
                    {getAvatarFallback(seller.name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div variants={itemVariants} className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-md">
                  {seller.name || 'Vendedor MakeStore'}
                </h1>
                {seller.profileDescription && (
                  <p className="text-base md:text-lg text-indigo-100/90 mt-3 max-w-2xl leading-relaxed">
                    {seller.profileDescription}
                  </p>
                )}
                {seller.whatsappLink && (
                  <Button 
                    asChild 
                    size="lg" 
                    className="mt-6 bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
                  >
                    <a href={seller.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5">
                      <MessageSquareText className="w-5 h-5" /> Contatar Vendedor
                    </a>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Seção de Produtos do Vendedor */}
        <motion.section variants={itemVariants} className="container mx-auto p-4 md:p-8 mt-0 md:-mt-8">
          <Card className="shadow-xl dark:bg-gray-800/70 backdrop-blur-sm border dark:border-gray-700/50 rounded-xl md:rounded-2xl">
            <CardHeader className="pb-4 pt-6 px-6 md:px-8 border-b dark:border-gray-700/50">
              <CardTitle className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <ShoppingBag className="mr-3 h-7 w-7 text-sky-600 dark:text-sky-500" />
                Produtos de {seller.name?.split(' ')[0] || 'Vendedor'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {seller.Product && seller.Product.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8"
                  variants={productListVariants}
                >
                  {seller.Product.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-xl font-medium">Este vendedor ainda não cadastrou produtos.</p>
                  <p className="mt-1 text-sm">Volte em breve ou explore produtos de outros vendedores.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
      <Footer />
    </div>
  );
}