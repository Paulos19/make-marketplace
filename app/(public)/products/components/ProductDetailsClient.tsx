'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Loader2, Minus, Plus, Share2, Store, Tag } from 'lucide-react';
import type { Product, User, Category } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';

type ProductWithDetails = Product & {
  user: Partial<User> & { 
    customRedirectUrl?: string | null;
    whatsappLink?: string | null;
    email?: string | null;
  };
  category: Category | null;
  priceType: string | null;
  productUrl?: string | null;
};

interface ProductDetailsClientProps {
  product: ProductWithDetails;
}

export function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '/img-placeholder.png');
  const [quantity, setQuantity] = useState(1);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isPremiumSeller = product.user.email === process.env.NEXT_PUBLIC_EMAIL_PREMIUM;
  const premiumRedirectUrl = product.productUrl || product.user.customRedirectUrl;

  const handleAddToFavorites = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + product.id);
      return;
    }
    setIsFavoriting(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao salvar o produto nos favoritos.');
      toast.success('Achadinho salvo na sua lista de favoritos!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.');
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleContactSeller = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + product.id);
      return;
    }
    setIsReserving(true);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível criar a reserva antes de contatar.');
      
      toast.success('Reserva criada! Redirecionando para o vendedor...');
      const whatsappMessage = encodeURIComponent(
        `Oiê psit! Tudo bem? \n\nVi seu produto no Zacaplace e reservei este achadinho:\n\n*Produto:* ${product.name}\n*Quantidade:* ${quantity}\n*Preço Total:* ${product.price !== null ? formatPrice(product.price * quantity) : 'a combinar'}\n\nQueria ver como faço pra gente fechar o negócio. É um estouro, psit! Aguardo seu retorno, abração!`
      );
      const whatsappUrl = `https://wa.me/${product.user.whatsappLink?.replace(/\D/g, '')}?text=${whatsappMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.');
    } finally {
      setIsReserving(false);
    }
  };

  const handleShare = async () => {
    if (!session) {
      toast.info("Você precisa estar logado para criar um link de partilha.");
      router.push('/auth/signin?callbackUrl=/products/' + product.id);
      return;
    }
    setIsSharing(true);
    try {
        const response = await fetch('/api/shortener', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: product.id,
                originalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
                title: product.name,
                description: product.description,
                imageUrl: product.images[0] || null,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível criar o link.');
        const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${data.shortCode}`;
        navigator.clipboard.writeText(shortUrl);
        toast.success("Link encurtado copiado para a área de transferência!");
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
        setIsSharing(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const isOnSale = product.onPromotion && product.originalPrice && product.price !== null && product.originalPrice > product.price;

  return (
    <div className="relative w-full min-h-[90vh] flex flex-col justify-center overflow-hidden bg-black text-white">
      
      {/* BACKGROUND (Netflix Style: Full width blurred image + Overlays) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.3, scale: 1.05 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 w-full h-full"
            >
                <Image 
                    src={selectedImage} 
                    alt="Background" 
                    fill 
                    className="object-cover blur-[80px] brightness-50"
                    priority
                />
            </motion.div>
        </AnimatePresence>
        {/* Dark Gradient Overlay for Readability (Left to Right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
        {/* Dark Gradient Overlay for Blending with the next section (Bottom to Top) */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="container mx-auto px-4 relative z-10 pt-32 pb-20 flex-1 flex flex-col justify-center">
        
        {/* Top Header / Metadata */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <Store className="w-4 h-4 text-white" />
                <span className="font-bold tracking-widest uppercase text-xs">
                    {product.user.storeName || product.user.name}
                </span>
            </div>
            
            {product.category && (
                <Link href={`/category/${product.categoryId}`} className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition">
                    <Tag className="w-3 h-3" />
                    <span className="text-xs font-bold tracking-widest uppercase">
                        {product.category.name}
                    </span>
                </Link>
            )}

            <button onClick={handleShare} className="ml-auto flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition">
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                <span className="text-sm font-bold uppercase tracking-widest hidden sm:inline-block">Partilhar</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
            
            {/* LEFT COLUMN: Typography & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-center">
                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 drop-shadow-xl"
                >
                    {product.name}
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 font-medium drop-shadow-md"
                >
                    {product.description}
                </motion.p>

                {/* Price Display */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-10"
                >
                    {product.priceType === 'ON_BUDGET' || product.price === null ? (
                        <div className="text-3xl md:text-4xl font-black text-rose-300">Sob Consulta</div>
                    ) : isOnSale ? (
                        <div className='flex items-baseline gap-4'>
                            <span className="text-5xl md:text-6xl font-black text-rose-300 drop-shadow-lg">{formatPrice(product.price)}</span>
                            <span className="text-2xl text-white/40 line-through font-bold">{formatPrice(product.originalPrice!)}</span>
                        </div>
                    ) : (
                        <div className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">{formatPrice(product.price)}</div>
                    )}
                    {isOnSale && <Badge className="mt-3 bg-red-600 text-white border-none font-bold uppercase tracking-widest shadow-lg shadow-red-600/30">Promoção Limitada</Badge>}
                </motion.div>

                {/* Call to Action */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full h-14 px-2 shadow-lg">
                        <Button variant="ghost" size="icon" className="hover:bg-white/20 hover:text-white rounded-full text-white" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4"/></Button>
                        <span className="w-12 text-center font-black text-xl">{quantity}</span>
                        <Button variant="ghost" size="icon" className="hover:bg-white/20 hover:text-white rounded-full text-white" onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}><Plus className="h-4 w-4"/></Button>
                    </div>

                    {isPremiumSeller ? (
                        <Button asChild className="h-14 px-10 rounded-full bg-white hover:bg-slate-200 text-black font-black text-lg flex-1 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105">
                            <Link href={premiumRedirectUrl || '#'} target="_blank" rel="noopener noreferrer">
                                IR À LOJA
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button className="h-14 px-8 rounded-full bg-rose-400 hover:bg-rose-300 text-rose-950 font-black text-lg flex-1 transition-all shadow-[0_0_40px_rgba(251,113,133,0.3)] hover:shadow-[0_0_60px_rgba(251,113,133,0.5)] hover:scale-105" onClick={handleContactSeller} disabled={isReserving}>
                                {isReserving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <MessageCircle className="mr-2 h-6 w-6"/>}
                                RESERVAR AGORA
                            </Button>
                            <Button variant="outline" className="h-14 w-14 rounded-full border-white/30 bg-white/5 backdrop-blur-md hover:bg-white hover:text-black text-white transition-all p-0 flex items-center justify-center shrink-0 shadow-lg hover:scale-105" onClick={handleAddToFavorites} disabled={isFavoriting}>
                                {isFavoriting ? <Loader2 className="h-6 w-6 animate-spin"/> : <Heart className="h-6 w-6"/>}
                            </Button>
                        </>
                    )}
                </motion.div>
            </div>

            {/* RIGHT COLUMN: The Floating Hero Image */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center relative min-h-[400px] lg:min-h-[600px] mt-12 lg:mt-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="relative w-full h-full flex items-center justify-center z-20"
                    >
                        <div className="relative w-[100%] aspect-square lg:w-[90%] max-w-3xl">
                            <Image 
                                src={selectedImage}
                                alt={product.name}
                                fill
                                className="object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]"
                                priority
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Thumbnails Gallery (Destaques) */}
                {product.images.length > 1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="absolute bottom-[-20px] left-0 right-0 flex justify-center z-30"
                    >
                        <div className="flex gap-4 p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl max-w-full overflow-x-auto custom-scrollbar">
                            {product.images.map((img, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setSelectedImage(img)}
                                    className={cn(
                                        "relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 shrink-0",
                                        selectedImage === img 
                                            ? "ring-2 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10" 
                                            : "opacity-50 hover:opacity-100 hover:scale-105"
                                    )}
                                >
                                    <Image src={img} alt={`Vista ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}