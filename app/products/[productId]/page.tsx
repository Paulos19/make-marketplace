"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { toast } from 'sonner';

// Componentes Shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Label } from '@/components/ui/label';

// Ícones Lucide
import {
  UserCircle2, MessageSquareText, ChevronRight, Store, Minus, Plus,
  PackageOpen, AlertTriangle, ShoppingCart, ArrowLeft, Share2, Loader2
} from 'lucide-react';

// Componentes de Layout
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import RelatedProducts from '../components/RelatedProducts'; 

// Tipos (Importante: Product deve incluir user, onPromotion, originalPrice)
import type { Product, Category as CategoryInfo } from '@/lib/types';

const mainVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const PRODUCTS_PER_RELATED_ROW = 8;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isReserving, setIsReserving] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentImageSlide, setCurrentImageSlide] = useState(0);

  useEffect(() => {
    if (productId) {
      const fetchProductAndRelated = async () => {
        setLoading(true);
        setError(null);
        setProduct(null);
        setRelatedProducts([]);
        try {
          const productResponse = await fetch(`/api/products/${productId}`);
          if (!productResponse.ok) {
            const errorData = await productResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${productResponse.status} ao buscar o achadinho.`);
          }
          const productData: Product = await productResponse.json();
          setProduct(productData);

          if (productData.categories && productData.categories.length > 0 && productData.user) {
            const primaryCategoryId = productData.categories[0].id;
            const relatedResponse = await fetch(`/api/products?categoryId=${primaryCategoryId}&limit=${PRODUCTS_PER_RELATED_ROW + 1}&all=true`);
            if (relatedResponse.ok) {
              const relatedData: Product[] = await relatedResponse.json();
              setRelatedProducts(relatedData.filter(p => p.id !== productId && p.user).slice(0, PRODUCTS_PER_RELATED_ROW));
            }
          }
        } catch (err: any) {
          setError(err.message || "Deu um 'Zacabum' ao carregar a página!");
          console.error("Erro ao buscar produto e relacionados:", err);
        }
        setLoading(false);
      };
      fetchProductAndRelated();
    } else {
      setError("ID do achadinho não especificado.");
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const onSelect = () => {
      if (carouselApi) {
        setCurrentImageSlide(carouselApi.selectedScrollSnap());
      }
    };
    carouselApi.on("select", onSelect);
    onSelect();
    return () => {
      if (carouselApi) {
        carouselApi.off("select", onSelect);
      }
    };
  }, [carouselApi]);

  const openWhatsAppWithMessage = useCallback(() => {
    if (!product || !product.user || !product.user.whatsappLink) {
      toast.error("Ô psit, o vendedor esqueceu o ZapZap ou os dados não carregaram!");
      return;
    }
    
    const whatsappLink = product.user.whatsappLink;
    const productName = product.name;
    const sellerName = product.user.name || 'vendedor(a)';
    const message = `Olá, ${sellerName}! Tenho interesse no produto que vi no Zacaplace:\n\n*Produto:* ${productName}\n*Quantidade:* ${selectedQuantity}\n\nAinda está disponível? Gostaria de combinar a entrega/pagamento.`;
    const encodedMessage = encodeURIComponent(message);

    let finalWhatsAppUrl = whatsappLink;
    if (whatsappLink.includes("?")) {
        finalWhatsAppUrl = `${whatsappLink}&text=${encodedMessage}`;
    } else {
        finalWhatsAppUrl = `${whatsappLink}?text=${encodedMessage}`;
    }
    const parts = finalWhatsAppUrl.split('?');
    if (parts.length > 2) {
        finalWhatsAppUrl = parts[0] + '?' + parts.slice(1).join('&');
    }
    
    window.open(finalWhatsAppUrl, '_blank', 'noopener,noreferrer');
  }, [product, selectedQuantity]);

  const handleWhatsAppRedirect = () => {
    openWhatsAppWithMessage();
  };

  const handleQuantityChange = (amount: number) => {
    setSelectedQuantity((prev) => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.quantity) {
        toast.error(`Só temos ${product.quantity} desse achadinho em estoque, cumpadi!`);
        return product.quantity;
      }
      return newQuantity;
    });
  };

  const handleReserveProduct = async () => {
    if (!product || !productId) return;
    if (selectedQuantity > product.quantity) { toast.error("Quantidade indisponível em estoque!"); return; }
    if (selectedQuantity <= 0) { toast.error("Selecione uma quantidade válida."); return; }
    if (product.quantity === 0) { toast.error("Produto esgotado!"); return; }
    
    setIsReserving(true); setError(null);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: selectedQuantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao criar reserva.');
      
      toast.success(`${selectedQuantity}x "${product.name}" reservado(s)!`,{
        description: "Você será redirecionado para o WhatsApp do vendedor.",
        duration: 3500
      });
      setProduct(prev => prev ? { ...prev, quantity: prev.quantity - selectedQuantity } : null);
      setSelectedQuantity(1);
      setTimeout(openWhatsAppWithMessage, 1500);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro na reserva: ${err.message}`);
    } finally {
      setIsReserving(false);
    }
  };

  const getAvatarFallback = (name?: string | null) => name ? name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : <UserCircle2 />;
  
  const shareProduct = () => {
    if (navigator.share && product) {
      navigator.share({ title: product.name, text: `Olha que achadinho: ${product.name}!`, url: window.location.href })
      .catch((error) => console.log('Erro ao compartilhar:', error));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link do produto copiado!"))
        .catch(() => toast.error("Falha ao copiar o link."));
    } else {
      toast.error("Compartilhamento não suportado neste navegador.");
    }
  };

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (error || !product || !product.user) { 
    return <ProductPageError error={error || "Produto não encontrado ou dados do vendedor ausentes."} />;
  }

  const seller = product.user;
  const sellerDisplayName = seller.storeName || seller.name || "Vendedor Zaca";
  const sellerAvatar = seller.image;
  const sellerWhatsappLink = seller.whatsappLink;
  const sellerIdForLink = seller.id;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <motion.main
        className="flex-grow py-8 lg:py-12"
        variants={mainVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <motion.div variants={itemVariants} className="mb-6 text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 flex-wrap">
            <Link href="/" className="hover:text-zaca-azul dark:hover:text-zaca-lilas">Zacaplace</Link>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            <Link href="/products" className="hover:text-zaca-azul dark:hover:text-zaca-lilas">Achadinhos</Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                <Link href={`/products?category=${product.categories[0].id}`} className="hover:text-zaca-azul dark:hover:text-zaca-lilas">{product.categories[0].name}</Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
          </motion.div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-16 items-start">
            {/* Seção de Imagens do Produto */}
            <motion.section variants={itemVariants} aria-labelledby="product-images" className="lg:col-span-7 xl:col-span-7">
              <Card className="shadow-xl overflow-hidden bg-white dark:bg-slate-800/50 border dark:border-slate-700/60 rounded-xl">
                <CardContent className="p-2 sm:p-3">
                  <Carousel setApi={setCarouselApi} className="w-full">
                    <CarouselContent>
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        product.imageUrls.map((url, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-square w-full relative bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                              <Image
                                src={url} alt={`${product.name} - imagem ${index + 1}`} fill
                                className="object-contain" priority={index === 0}
                                sizes="(max-width: 1024px) 100vw, 60vw"
                              />
                            </div>
                          </CarouselItem>
                        ))
                      ) : (
                        <CarouselItem>
                          <div className="aspect-square w-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <PackageOpen className="h-24 w-24 text-slate-400 dark:text-slate-500" />
                          </div>
                        </CarouselItem>
                      )}
                    </CarouselContent>
                    {product.imageUrls && product.imageUrls.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 shadow-md text-slate-700 dark:text-slate-200" />
                        <CarouselNext className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 shadow-md text-slate-700 dark:text-slate-200" />
                      </>
                    )}
                  </Carousel>
                </CardContent>
              </Card>
              {product.imageUrls && product.imageUrls.length > 1 && (
                <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {product.imageUrls.map((url, index) => (
                    <button
                      key={index} onClick={() => carouselApi?.scrollTo(index)}
                      className={`aspect-square w-full rounded-md overflow-hidden border-2 transition-all duration-150
                        ${index === currentImageSlide ? 'border-zaca-azul ring-2 ring-zaca-azul ring-offset-2 dark:ring-offset-slate-900' : 'border-slate-200 dark:border-slate-700 hover:border-zaca-lilas dark:hover:border-zaca-lilas opacity-70 hover:opacity-100'}`}
                      aria-label={`Ver imagem ${index + 1}`}
                    >
                       <div className="relative w-full h-full bg-slate-100 dark:bg-slate-700">
                        <Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-contain"/>
                       </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Seção de Detalhes do Produto */}
            <motion.section variants={itemVariants} aria-labelledby="product-details" className="lg:col-span-5 xl:col-span-5 mt-8 lg:mt-0 space-y-6">
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map(category => (
                    <Badge key={category.id} variant="outline" className="text-xs sm:text-sm border-zaca-lilas/70 text-zaca-roxo dark:border-zaca-lilas/70 dark:text-zaca-lilas bg-zaca-lilas/10 dark:bg-zaca-lilas/5">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              <h1 id="product-details" className="text-3xl sm:text-4xl font-bangers tracking-tight text-slate-900 dark:text-slate-50 filter drop-shadow-sm">
                {product.name}
              </h1>

              {/* Lógica de Exibição de Preço Promocional */}
              <div className="flex items-baseline gap-x-3">
                {product.onPromotion && product.originalPrice != null && product.originalPrice > product.price && (
                  <p className="text-xl text-slate-500 dark:text-slate-400 line-through" aria-label={`De R$ ${product.originalPrice.toFixed(2)}`}>
                    R$ {product.originalPrice.toFixed(2)}
                  </p>
                )}
                <p className={`text-3xl sm:text-4xl font-extrabold ${product.onPromotion ? 'text-zaca-vermelho' : 'text-zaca-roxo dark:text-zaca-lilas'}`}>
                  R$ {product.price.toFixed(2)}
                </p>
              </div>

              {product.onPromotion && (
                   <Badge variant="destructive" className="mt-1 text-sm bg-zaca-vermelho hover:bg-zaca-vermelho/90 text-white shadow-md">
                    OFERTA DO ZACA!
                   </Badge>
              )}
               <p className="text-sm text-slate-500 dark:text-slate-400">
                {product.quantity > 0 ? `${product.quantity} em estoque, cumpadi!` : "Produto esgotado!"}
              </p>

              <Separator className="my-5 dark:bg-slate-700/80" />

              <div>
                <h2 className="text-xl font-bangers mb-2 text-slate-800 dark:text-slate-200 tracking-wide">Descrição do Achadinho:</h2>
                <article className="prose prose-sm sm:prose-base dark:prose-invert text-slate-700 dark:text-slate-300 max-w-none whitespace-pre-wrap">
                  {product.description || 'O Zaca ficou tão animado com este produto que esqueceu de botar a descrição! Mas confia, é coisa boa!'}
                </article>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3">
                  <Label htmlFor="quantity" className="text-sm font-medium dark:text-slate-300">Quantidade:</Label>
                  <div className="flex items-center border rounded-md border-slate-300 dark:border-slate-600 overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(-1)} disabled={selectedQuantity <= 1 || product.quantity === 0} className="h-10 w-10 rounded-none text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" id="quantity" value={selectedQuantity} readOnly
                      className="w-14 h-10 text-center border-y-0 border-x border-slate-300 dark:border-slate-600 rounded-none bg-transparent dark:text-slate-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(1)} disabled={selectedQuantity >= product.quantity || product.quantity === 0} className="h-10 w-10 rounded-none text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  size="lg" onClick={handleReserveProduct} disabled={isReserving || product.quantity === 0}
                  className="w-full bg-btn-fale-vendedor text-btn-fale-vendedor-foreground hover:bg-btn-fale-vendedor-hover text-base font-semibold py-3 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {isReserving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShoppingCart className="mr-2 h-5 w-5" />}
                  {isReserving ? "Reservando..." : (product.quantity === 0 ? "Esgotado!" : "Reservar e Contatar Vendedor")}
                </Button>
                 <Button variant="outline" size="lg" onClick={shareProduct} className="w-full text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    <Share2 className="mr-2 h-5 w-5"/> Compartilhar Achadinho
                </Button>
              </div>

              <Separator className="my-6 dark:bg-slate-700/80" />

              {/* Card do Vendedor - Acessa dados através de 'seller' (product.user) */}
              {seller && (
                <Card className="bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl">
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-lg font-semibold flex items-center text-slate-800 dark:text-slate-200 font-bangers tracking-wide">
                       <Store className="mr-2 h-5 w-5 text-zaca-azul" /> Vendido por:
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-zaca-lilas/70">
                        <AvatarImage src={sellerAvatar || undefined} alt={sellerDisplayName} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {getAvatarFallback(seller.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {sellerIdForLink ? (
                            <Link href={`/seller/${sellerIdForLink}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-zaca-azul dark:hover:text-zaca-lilas transition-colors">
                                {sellerDisplayName}
                            </Link>
                        ) : (
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{sellerDisplayName}</span>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ver mais achadinhos deste Zaca</p>
                      </div>
                    </div>
                    
                    {sellerWhatsappLink ? (
                      <Button
                        onClick={handleWhatsAppRedirect} variant="outline"
                        className="w-full border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-600/20 dark:hover:text-green-300 transition-colors"
                      >
                        <MessageSquareText className="mr-2 h-5 w-5" /> Chamar o Zaca no Zap
                      </Button>
                    ) : (
                      <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic p-2 border rounded-md dark:border-slate-700">
                        Este Zaca esqueceu o ZapZap em casa!
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.section>
          </div>
        </div>
        
        {relatedProducts.length > 0 && (
            <RelatedProducts 
                title="Quem viu este, curtiu estes também, cumpadi!"
                products={relatedProducts} 
                currentProductId={productId}
            />
        )}
      </motion.main>
      <Footer />
    </div>
  );
}

// --- Componentes de Fallback ---
const ProductPageSkeleton = () => (
    <div className="flex flex-col min-h-screen"><Navbar /><main className="flex-grow py-8 lg:py-12"><div className="container mx-auto px-4"><Skeleton className="h-6 w-3/4 sm:w-1/2 mb-8 bg-slate-200 dark:bg-slate-700 rounded-md" /><div className="lg:grid lg:grid-cols-12 gap-10"><section className="lg:col-span-7"><Skeleton className="w-full aspect-square rounded-xl mb-4 bg-slate-300 dark:bg-slate-700" /></section><section className="lg:col-span-5 mt-8 lg:mt-0 space-y-5"><Skeleton className="h-10 w-4/5 rounded bg-slate-300 dark:bg-slate-700" /><Skeleton className="h-8 w-1/2 rounded bg-slate-300 dark:bg-slate-700" /><Skeleton className="h-20 w-full rounded bg-slate-200 dark:bg-slate-600" /></section></div></div></main><Footer /></div>
);
const ProductPageError = ({ error }: { error: string }) => (
    <div className="flex flex-col min-h-screen"><Navbar /><main className="flex-grow flex items-center justify-center p-4"><div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md"><AlertTriangle className="mx-auto h-16 w-16 text-zaca-vermelho mb-4" /><h1 className="text-2xl font-bangers text-zaca-vermelho mb-2">Xiii, Deu Ruim!</h1><p className="text-slate-700 dark:text-slate-300 mb-6">{error}</p><Button asChild className="bg-zaca-azul hover:bg-zaca-azul/90 text-white"><Link href="/products"><ArrowLeft className="mr-2 h-4 w-4"/>Ver outros Achadinhos</Link></Button></div></main><Footer /></div>
);
