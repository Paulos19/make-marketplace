// app/products/[productId]/page.tsx (ou o caminho correto)
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter para navegação
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Componentes Shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input'; // Para seletor de quantidade
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Para thumbnails (opcional avançado)
} from "@/components/ui/carousel";

// Ícones Lucide
import {
  UserCircle2, 
  MessageSquareText, 
  ClipboardCheck, // Ícone para reserva
  ChevronLeft, 
  ChevronRight, 
  Tag, 
  Store, 
  Minus, 
  Plus, 
  PackageOpen, 
  AlertTriangle,
  ShoppingCart, 
  // ShoppingCart // Removido ou substituído
} from 'lucide-react';

import { Label } from '@/components/ui/label';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
  user: {
    id: string;
    name: string | null;
    image?: string | null; // Adicionando imagem do usuário/vendedor opcional
    whatsappLink: string | null;
  };
  createdAt: string; // Mantido para possível uso, como "Novidade"
  categories: { id: string; name: string }[];
  onPromotion?: boolean;
  originalPrice?: number | null;
  quantity: number; // <<< ADICIONADO: Estoque disponível do produto
}

const mainVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1); // Renomeado de 'quantity' para 'selectedQuantity'
  const [isReserving, setIsReserving] = useState(false); // Estado para feedback do botão
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentImageSlide, setCurrentImageSlide] = useState(0);


  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Erro: ${response.status}` }));
            throw new Error(errorData.error || `Erro ao buscar produto: ${response.status}`);
          }
          const data = await response.json();
          setProduct(data);
        } catch (err: any) {
          setError(err.message);
          console.error("Fetch product error:", err);
        }
        setLoading(false);
      };
      fetchProduct();
    } else {
      setError("ID do produto não encontrado.");
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentImageSlide(carouselApi.selectedScrollSnap()); // Seta o slide inicial
    carouselApi.on("select", () => {
      setCurrentImageSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);


  const handleWhatsAppRedirect = () => {
    if (product?.user?.whatsappLink) {
      window.open(product.user.whatsappLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuantityChange = (amount: number) => {
    setSelectedQuantity((prev) => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      // Limitar pela quantidade em estoque, se o produto estiver carregado
      if (product && newQuantity > product.quantity) {
        // alert(`Apenas ${product.quantity} em estoque.`); // Opcional: feedback imediato
        return product.quantity; 
      }
      return newQuantity;
    });
  };

  const handleReserveProduct = async () => {
    if (!product || !productId) return;
    if (selectedQuantity > product.quantity) {
      toast("Não é possível reservar mais produtos do que o disponível em estoque.");
      return;
    }
    if (selectedQuantity <= 0) {
      toast("Selecione uma quantidade válida para reservar.");
      return;
    }
    if (product.quantity === 0) {
      toast("Este produto está fora de estoque.");
      return;
    }

    setIsReserving(true);
    setError(null);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: selectedQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao fazer a reserva.');
      }

      toast(`Reserva de ${selectedQuantity}x "${product.name}" realizada com sucesso!`);
      // Atualizar o estoque do produto no frontend
      setProduct(prevProduct => prevProduct ? { ...prevProduct, quantity: prevProduct.quantity - selectedQuantity } : null);
      setSelectedQuantity(1); // Resetar quantidade selecionada
      // Idealmente, redirecionar para uma página de confirmação ou minhas reservas
      // router.push('/dashboard/my-reservations'); 

    } catch (err: any) {
      console.error("Reservation error:", err);
      setError(err.message || "Ocorreu um erro ao tentar reservar o produto.");
      alert(`Erro ao reservar: ${err.message}`);
    } finally {
      setIsReserving(false);
    }
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    // Lógica para adicionar ao carrinho (ex: usando context, Zustand, ou API)
    console.log(`Adicionado ${selectedQuantity}x "${product.name}" ao carrinho.`);
    // toast.success(`${selectedQuantity}x "${product.name}" adicionado ao carrinho!`); // Requer 'sonner' ou similar
  };
  
  const getAvatarFallback = (name?: string | null) => {
    if (name) {
      const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow py-8 lg:py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start">
              {/* Skeleton para Galeria de Imagens */}
              <section>
                <Skeleton className="w-full aspect-square rounded-xl mb-4" />
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full aspect-square rounded-md" />)}
                </div>
              </section>
              {/* Skeleton para Detalhes do Produto */}
              <section className="mt-6 lg:mt-0 space-y-6">
                <Skeleton className="h-10 w-3/4 rounded" />
                <div className="flex space-x-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div>
                <Skeleton className="h-12 w-1/3 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Separator className="my-6 dark:bg-gray-700" />
                <div className="flex items-center space-x-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-6 w-1/2 rounded" /></div>
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-8 lg:py-12 bg-gray-50 dark:bg-gray-900 text-center px-4">
          <div>
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 dark:text-red-400 mb-4" />
            <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">Oops! Algo deu errado.</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
            <Button onClick={() => router.push('/products')} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Voltar para Produtos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
     return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-8 lg:py-12 bg-gray-50 dark:bg-gray-900 text-center px-4">
          <div>
            <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Produto Não Encontrado</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">O produto que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => router.push('/products')} className="bg-sky-600 hover:bg-sky-700 text-white">
              Ver outros produtos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <motion.main 
        className="flex-grow py-8 lg:py-16 bg-gray-50 dark:bg-gray-900"
        variants={mainVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs (Exemplo simples, pode ser um componente mais robusto) */}
          <motion.div variants={itemVariants} className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400">Home</Link>
            <ChevronRight className="inline mx-1 h-4 w-4" />
            <Link href="/products" className="hover:text-sky-600 dark:hover:text-sky-400">Produtos</Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <ChevronRight className="inline mx-1 h-4 w-4" />
                <Link href={`/categories/${product.categories[0].id}`} className="hover:text-sky-600 dark:hover:text-sky-400">{product.categories[0].name}</Link>
              </>
            )}
            <ChevronRight className="inline mx-1 h-4 w-4" />
            <span className="text-gray-700 dark:text-gray-200">{product.name}</span>
          </motion.div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-16 items-start">
            {/* Coluna da Galeria de Imagens */}
            <motion.section variants={itemVariants} aria-labelledby="product-images" className="lg:col-span-7 xl:col-span-7">
              <Card className="shadow-xl overflow-hidden dark:bg-gray-800/50 dark:border-gray-700">
                <CardContent className="p-0">
                  <Carousel setApi={setCarouselApi} className="w-full">
                    <CarouselContent>
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        product.imageUrls.map((url, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-[4/3] w-full relative bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                              <Image
                                src={url}
                                alt={`${product.name} - imagem ${index + 1}`}
                                fill
                                className="object-contain" // ou object-cover dependendo do design desejado
                                priority={index === 0}
                                sizes="(max-width: 1024px) 100vw, 60vw"
                              />
                            </div>
                          </CarouselItem>
                        ))
                      ) : (
                        <CarouselItem>
                          <div className="aspect-[4/3] w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                            <PackageOpen className="h-24 w-24 text-gray-400 dark:text-gray-500" />
                          </div>
                        </CarouselItem>
                      )}
                    </CarouselContent>
                    {product.imageUrls && product.imageUrls.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 shadow-md disabled:opacity-30" />
                        <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 shadow-md disabled:opacity-30" />
                      </>
                    )}
                  </Carousel>
                </CardContent>
              </Card>
              {/* Thumbnails (Opcional - requer mais lógica com o CarouselApi) */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
                  {product.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => carouselApi?.scrollTo(index)}
                      className={`aspect-square w-full rounded-md overflow-hidden border-2 transition-all duration-150
                        ${index === currentImageSlide ? 'border-sky-500 ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-gray-900' : 'border-gray-200 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-600 opacity-70 hover:opacity-100'}`}
                      aria-label={`Ver imagem ${index + 1}`}
                    >
                       <div className="relative w-full h-full">
                        <Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-cover"/>
                       </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Coluna de Detalhes e Ações */}
            <motion.section variants={itemVariants} aria-labelledby="product-details" className="lg:col-span-5 xl:col-span-5 mt-8 lg:mt-0 space-y-6">
              {/* Categorias */}
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories.map(category => (
                    <Badge key={category.id} variant="outline" className="text-xs sm:text-sm border-sky-500/70 text-sky-700 dark:border-sky-600/70 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/30">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              <h1 id="product-details" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                {product.name}
              </h1>

              {/* Preço */}
              <div className="mt-3">
                {product.onPromotion && product.originalPrice && (
                  <p className="text-lg text-gray-500 dark:text-gray-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </p>
                )}
                <p className={`text-3xl sm:text-4xl font-bold ${product.onPromotion ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-gray-50'}`}>
                  R$ {product.price.toFixed(2)}
                </p>
                {product.onPromotion && (
                   <Badge variant="destructive" className="mt-2 text-sm bg-red-500 hover:bg-red-600 text-white">OFERTA ESPECIAL</Badge>
                )}
              </div>

              <Separator className="my-6 dark:bg-gray-700" />

              {/* Descrição */}
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Descrição do Produto</h2>
                <article className="prose prose-sm sm:prose-base dark:prose-invert text-gray-700 dark:text-gray-300 max-w-none whitespace-pre-wrap">
                  {product.description || 'Nenhuma descrição detalhada disponível para este produto.'}
                </article>
              </div>

              <Separator className="my-6 dark:bg-gray-700" />
              
              {/* Ações: Quantidade e Adicionar ao Carrinho */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Label htmlFor="quantity" className="text-sm font-medium dark:text-gray-300">Quantidade:</Label>
                  <div className="flex items-center border rounded-md dark:border-gray-600">
                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(-1)} disabled={selectedQuantity <= 1} className="h-10 w-10 rounded-r-none dark:hover:bg-gray-700">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      id="quantity" 
                      value={selectedQuantity} 
                      readOnly // ou onChange se quiser permitir digitação
                      className="w-16 h-10 text-center border-l border-r rounded-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(1)} className="h-10 w-10 rounded-l-none dark:hover:bg-gray-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleReserveProduct} 
                  className="w-full bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-lg font-semibold py-3 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Reservar
                </Button>
              </div>

              <Separator className="my-6 dark:bg-gray-700" />

              {/* Informações do Vendedor */}
              {product.user && (
                <Card className="bg-gray-50 dark:bg-gray-800/70 border dark:border-gray-700/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-200">
                       <Store className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400"/> Informações do Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={product.user.image || undefined} alt={product.user.name || 'Vendedor'} />
                        <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                          {getAvatarFallback(product.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{product.user.name || 'Vendedor Anônimo'}</p>
                        <Link href={`/seller/${product.user.id}`} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
                          Ver perfil e outros produtos
                        </Link>
                      </div>
                    </div>
                    
                    {product.user.whatsappLink ? (
                      <Button
                        onClick={handleWhatsAppRedirect}
                        variant="outline"
                        className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white dark:border-green-600 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white transition-colors"
                      >
                        <MessageSquareText className="mr-2 h-5 w-5" />
                        Contatar Vendedor no WhatsApp
                      </Button>
                    ) : (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic p-2 border rounded-md dark:border-gray-700">
                        Contato do WhatsApp não fornecido pelo vendedor.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.section>
          </div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}