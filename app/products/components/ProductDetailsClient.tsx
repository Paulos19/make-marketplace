'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Loader2, Minus, Plus, Info, Share2, Send } from 'lucide-react';
import type { Product, User, Category, ProductCondition } from '@prisma/client';

// Mapeamento para exibir os nomes em português
const conditionLabels: Record<ProductCondition, string> = {
  NEW: 'Novo',
  GOOD_CONDITION: 'Em boas condições',
  USED: 'Usado',
  REFURBISHED: 'Recondicionado',
  OTHER: 'Outro',
};

// Tipo atualizado para incluir os novos campos do vendedor premium
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
  const [isFavoriting, setIsFavoriting] = useState(false); // Estado para favoritar
  const [isReserving, setIsReserving] = useState(false); // Estado para reservar/contatar
  const [isSharing, setIsSharing] = useState(false);

  // Lógica para Vendedor Premium (inalterada)
  const isPremiumSeller = product.user.email === process.env.NEXT_PUBLIC_EMAIL_PREMIUM;
  const premiumRedirectUrl = product.productUrl || product.user.customRedirectUrl;

  // --- NOVA FUNÇÃO: Adicionar aos Favoritos ---
  const handleAddToFavorites = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + product.id);
      return;
    }
    setIsFavoriting(true);
    try {
      // Chama a nova API de favoritos que você irá criar
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar o produto nos favoritos.');
      }
      toast.success('Achadinho salvo na sua lista de favoritos!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.');
    } finally {
      setIsFavoriting(false);
    }
  };

  // --- NOVA FUNÇÃO: Contatar Vendedor (que agora cria a reserva) ---
  const handleContactSeller = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + product.id);
      return;
    }

    setIsReserving(true);
    try {
      // 1. Cria a reserva que aparecerá para o vendedor
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível criar a reserva antes de contatar.');
      }
      
      toast.success('Reserva criada! Redirecionando para o vendedor...');

      // 2. Se a reserva foi criada, abre o link do WhatsApp
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

  // Função de compartilhamento (inalterada)
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Coluna da Galeria de Imagens (inalterada) */}
      <div className="space-y-4">
        <div className="aspect-square w-full overflow-hidden rounded-lg border bg-white shadow-sm relative">
          <Image
            src={selectedImage}
            alt={product.name}
            fill
            className="h-full w-full object-contain"
          />
           {isOnSale && (
             <Badge className="absolute top-3 right-3 text-sm bg-red-500 text-white border-none shadow-lg">PROMOÇÃO</Badge>
        )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {product.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={cn(
                'aspect-square w-full rounded-md overflow-hidden border-2 transition',
                selectedImage === img ? 'border-primary' : 'border-transparent hover:border-slate-300'
              )}
            >
              <Image
                src={img}
                alt={`${product.name} thumbnail ${idx + 1}`}
                width={100}
                height={100}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Coluna de Detalhes e Ações (inalterada, exceto pelos botões) */}
      <div className="space-y-6">
        <div>
          {product.category && (
            <Link href={`/category/${product.categoryId}`} className="text-sm font-medium text-primary hover:underline">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
          <div className="mt-3">
            {product.priceType === 'ON_BUDGET' || product.price === null ? (
              <div className="text-3xl font-bold text-primary">Orçamento a combinar</div>
            ) : isOnSale ? (
                <div className='flex items-baseline gap-3'>
                    <span className="text-2xl text-muted-foreground line-through">{formatPrice(product.originalPrice!)}</span>
                    <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
                </div>
            ) : (
                <div className="text-3xl font-bold text-primary">{formatPrice(product.price)}</div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            {product.condition && (
                <Badge variant="outline">Condição: {conditionLabels[product.condition]}</Badge>
            )}
          </div>
        </div>
        
        <div className="prose dark:prose-invert text-muted-foreground">
          <p>{product.description}</p>
        </div>

        <Card className="bg-background">
          <CardContent className="p-4 flex items-center justify-between">
            <div className='flex items-center gap-4'>
                <Avatar className="h-12 w-12">
                <AvatarImage src={product.user.image || undefined} />
                <AvatarFallback>{(product.user.storeName || product.user.name || 'V')[0]}</AvatarFallback>
                </Avatar>
                <div>
                <p className="text-sm text-muted-foreground">Vendido por</p>
                <Link href={`/seller/${product.user.id}`} className="font-semibold text-foreground hover:underline">
                    {product.user.storeName || product.user.name}
                </Link>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing}>
                {isSharing ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-7 w-7"/>}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
            <p className="font-medium">Quantidade:</p>
            <div className="flex items-center rounded-lg border">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4"/></Button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}><Plus className="h-4 w-4"/></Button>
            </div>
            <p className="text-sm text-muted-foreground">{product.quantity} disponíveis</p>
        </div>
        
        {/* --- LÓGICA DO BOTÃO ATUALIZADA --- */}
        <div className="grid grid-cols-1 gap-4">
          {isPremiumSeller ? (
            <Button asChild size="lg" className="w-full text-lg py-6 bg-zaca-vermelho hover:bg-zaca-vermelho/90 text-white">
              <Link href={premiumRedirectUrl || '#'} target="_blank" rel="noopener noreferrer">
                <Send className="mr-2 h-5 w-5" />
                Ir Para o Produto
              </Link>
            </Button>
          ) : (
            // Botões para Vendedores Comuns com a nova lógica
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button size="lg" variant="outline" onClick={handleAddToFavorites} disabled={isFavoriting}>
                {isFavoriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Heart className="mr-2 h-4 w-4"/>}
                Salvar na minha lista
              </Button>
              <Button size="lg" className="w-full bg-green-500 hover:bg-green-600" onClick={handleContactSeller} disabled={isReserving}>
                  {isReserving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4"/>}
                  Contatar Vendedor
              </Button>
            </div>
          )}
        </div>

        <div className='text-sm text-muted-foreground flex items-center gap-2'>
            <Info className='h-4 w-4' />
            <span>Salvar um item cria um favorito. Contatar o vendedor cria uma reserva.</span>
        </div>
      </div>
    </div>
  );
}