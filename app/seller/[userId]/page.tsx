// app/seller/[userId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Componentes Shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Ícones Lucide
import { MessageSquareText, ShoppingBag, UserCircle2, PackageOpen, AlertTriangle, Store, ArrowLeft } from 'lucide-react';

// Componentes de Layout (assumindo que existem)
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

// Tipos (devem corresponder à resposta da API /api/seller/[userId])
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
  createdAt: string; // ou Date
}

interface SellerProfile {
  id: string;
  name?: string | null;               // Vem de User.name
  image?: string | null;              // Vem de User.image
  storeName?: string | null;          // Vem de User.storeName
  whatsappLink?: string | null;       // Vem de User.whatsappLink
  profileDescription?: string | null; // Vem de User.profileDescription
  sellerBannerImageUrl?: string | null;// Vem de User.sellerBannerImageUrl
  products: SellerProduct[];          // Vem de User.products
  // Adicionar email e createdAt se você quiser usá-los da API
  email?: string | null;
  createdAt?: string; // ou Date
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// Componente do Card de Produto do Vendedor (interno a esta página)
const SellerProductCard = ({ product }: { product: SellerProduct }) => (
    <motion.div variants={itemVariants} className="h-full">
      <Link href={`/products/${product.id}`} className="block group focus-visible:ring-2 focus-visible:ring-zaca-roxo focus-visible:ring-offset-2 rounded-lg" aria-label={`Ver detalhes de ${product.name}`}>
        <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 transform group-hover:scale-[1.03] hover:border-zaca-magenta dark:hover:border-zaca-magenta">
          <CardHeader className="p-0 relative border-b dark:border-slate-700/50">
            <div className="aspect-square w-full relative bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden">
              <Image
                src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/img-placeholder.png'} 
                alt={`Imagem de ${product.name}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            {product.onPromotion && (
              <Badge
                variant="destructive"
                className="absolute top-2.5 right-2.5 bg-zaca-vermelho hover:bg-zaca-vermelho/90 text-white shadow-md px-2.5 py-1 text-xs font-semibold border-none"
              >
                PROMO!
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-grow p-4 space-y-1.5">
            <h3 className="text-md font-semibold leading-snug mb-1 truncate text-slate-800 dark:text-slate-100 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas transition-colors">
              {product.name}
            </h3>
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.categories.slice(0, 2).map(category => (
                  <Badge key={category.id} variant="secondary" className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{category.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-2 border-t dark:border-slate-700/50 mt-auto bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              {product.onPromotion && product.originalPrice && product.originalPrice > product.price && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                  R$ {product.originalPrice.toFixed(2)}
                </p>
              )}
              <p className={`font-bold text-lg ${product.onPromotion ? 'text-zaca-vermelho' : 'text-slate-900 dark:text-slate-50'}`}>
                R$ {product.price.toFixed(2)}
              </p>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );

// Skeleton para o Card de Produto
const SellerProductCardSkeleton = () => (
    <Card className="h-full flex flex-col dark:bg-slate-800/70 dark:border-slate-700/80">
      <CardHeader className="p-0 relative"><Skeleton className="w-full aspect-square rounded-t-lg bg-slate-300 dark:bg-slate-700" /></CardHeader>
      <CardContent className="flex-grow p-4 space-y-3"><Skeleton className="h-5 w-3/4 rounded bg-slate-300 dark:bg-slate-600" /><div className="flex gap-2"><Skeleton className="h-5 w-1/4 rounded-full bg-slate-200 dark:bg-slate-600" /><Skeleton className="h-5 w-1/3 rounded-full bg-slate-200 dark:bg-slate-600" /></div></CardContent>
      <CardFooter className="p-4 pt-0 mt-auto"><div className="w-full space-y-1"><Skeleton className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-600" /><Skeleton className="h-7 w-1/3 rounded bg-slate-300 dark:bg-slate-600" /></div></CardFooter>
    </Card>
);

export default function SellerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string; // userId do vendedor que está sendo visualizado
  
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
        if (userId) {
          const fetchSellerProfile = async () => {
            setIsLoading(true);
            setError(null);
            setSeller(null); // Limpa o estado anterior
            try {
              const response = await fetch(`/api/seller/${userId}`);
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Falha ao buscar perfil do vendedor (status: ${response.status})` }));
                throw new Error(errorData.error || `Falha ao buscar perfil do Zaca (status: ${response.status})`);
              }
              const data: SellerProfile = await response.json();
              setSeller(data);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido, cumpadi!';
              setError(errorMessage);
              console.error("Falha ao buscar perfil do vendedor:", err); // Este é o log que você está vendo
            } finally {
              setIsLoading(false);
            }
          };
          fetchSellerProfile();
        } else {
            setError("ID do Zaca (vendedor) não especificado na URL.");
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
            <Skeleton className="w-full h-64 md:h-80 rounded-xl mb-8 bg-slate-300 dark:bg-slate-700" />
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-10 -mt-16 md:-mt-24 relative z-10 p-6">
              <Skeleton className="w-28 h-28 md:w-36 md:h-36 rounded-full shrink-0 border-4 border-white dark:border-slate-800 bg-slate-300 dark:bg-slate-600" />
              <div className="flex-1 space-y-3 text-center md:text-left mt-4 md:mt-16">
                <Skeleton className="h-10 w-3/4 md:w-1/2 rounded-md bg-slate-300 dark:bg-slate-600" />
                <Skeleton className="h-5 w-full md:w-3/4 rounded-md bg-slate-200 dark:bg-slate-500" />
                <Skeleton className="h-10 w-48 rounded-lg mt-2 bg-slate-300 dark:bg-slate-600" />
              </div>
            </div>
            <section><Skeleton className="h-8 w-1/3 mb-8 rounded-md bg-slate-300 dark:bg-slate-600" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <SellerProductCardSkeleton key={`skeleton-${i}`} />)}</div></section>
          </main>
          <Footer />
        </div>
      );
    }
  
    if (error) { // Este bloco está sendo acionado pelo 404 da API
      return (
         <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow flex items-center justify-center text-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md">
              <AlertTriangle className="mx-auto h-16 w-16 text-zaca-vermelho mb-4"/>
              <h1 className="text-2xl font-bangers text-zaca-vermelho mb-2">Xiii, Deu Ruim, Cumpadi!</h1>
              <p className="text-slate-700 dark:text-slate-300 mb-6">{error}</p>
              <Button onClick={() => router.push('/')} className="bg-zaca-azul hover:bg-zaca-azul/90 text-white">
                  <ArrowLeft className="mr-2 h-4 w-4"/> Voltar pro Início
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
  
    // Esta condição é para o caso de a API retornar 200 OK mas sem dados (improvável com a API atual)
    if (!seller) { 
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow flex items-center justify-center text-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md">
              <Store className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4"/>
              <h1 className="text-2xl font-bangers text-slate-700 dark:text-slate-200 mb-2">Uai, Cadê o Zaca?</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Este vendedor não foi encontrado ou não está mais na praça!</p>
              <Button onClick={() => router.push('/products')} className="bg-zaca-roxo hover:bg-zaca-roxo/90 text-white">
                  Ver Outros Achadinhos
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
    
    // Se chegou aqui, 'seller' existe e não há erro.
    const displayName = seller.storeName || seller.name || 'Vendedor Zaca';
  
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <motion.div 
          className="flex-grow"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.header 
            variants={itemVariants}
            className="relative h-64 md:h-80 lg:h-96 w-full group"
          >
            {seller.sellerBannerImageUrl ? (
              <Image src={seller.sellerBannerImageUrl} alt={`Banner de ${displayName}`} fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zaca-lilas via-zaca-roxo to-zaca-magenta flex items-center justify-center">
                <Store className="w-24 h-24 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
          </motion.header>
  
          <motion.div 
            variants={itemVariants} 
            className="container mx-auto px-4 md:px-8 -mt-16 md:-mt-24 relative z-10"
          >
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl md:flex md:items-end md:gap-6 lg:gap-8">
              <div className="md:flex-shrink-0 mb-6 md:mb-0 text-center md:text-left">
                <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white dark:border-slate-800 shadow-xl mx-auto md:mx-0">
                  <AvatarImage src={seller.image || undefined} alt={displayName} />
                  <AvatarFallback className="text-4xl md:text-5xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {getAvatarFallback(seller.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wider mb-1">
                  {displayName}
                </h1>
                {seller.storeName && seller.name && seller.storeName !== seller.name && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Por: {seller.name}</p>
                )}
                {seller.profileDescription && (
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4 leading-relaxed max-w-2xl mx-auto md:mx-0 line-clamp-3">
                    {seller.profileDescription}
                  </p>
                )}
                {seller.whatsappLink && (
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-btn-fale-vendedor text-btn-fale-vendedor-foreground hover:bg-btn-fale-vendedor-hover shadow-md hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
                  >
                    <a href={seller.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <MessageSquareText className="w-5 h-5" /> Contatar o Zaca
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
  
          <motion.section 
            variants={itemVariants} 
            className="container mx-auto p-4 md:p-8 mt-8 md:mt-12"
          >
            <Card className="shadow-xl dark:bg-slate-800/70 border-0">
              <CardHeader className="pb-4 pt-6 px-6 md:px-8 border-b border-slate-200 dark:border-slate-700/50">
                <CardTitle className="text-2xl md:text-3xl font-bangers text-slate-800 dark:text-slate-100 flex items-center tracking-wide">
                  <ShoppingBag className="mr-3 h-6 w-6 md:h-7 md:w-7 text-zaca-azul" />
                  Achadinhos do Zaca {displayName.split(' ')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8">
                {seller.products && seller.products.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-8"
                    variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                    initial="hidden"
                    animate="visible"
                  >
                    {seller.products.map((product) => (
                      <SellerProductCard key={product.id} product={product} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <PackageOpen className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                    <p className="text-xl font-semibold">Ô psit, este Zaca ainda não tem produtos!</p>
                    <p className="mt-1 text-sm">Parece que ele foi dar uma "zacariada" e esqueceu de cadastrar. Volte mais tarde!</p>
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
