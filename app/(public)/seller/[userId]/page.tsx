"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MessageCircle, ChevronLeft, ChevronRight, Ban, Share2, Loader2, Send, PackageOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { MiniProductCard } from '@/app/components/product/MiniProductCard'
import { ProductCardSkeleton } from '@/app/(public)/products/components/ProductCard'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

// Tipos
type Review = {
    id: string;
    rating: number;
    comment: string | null;
    buyer: { name: string | null; image: string | null; };
    createdAt?: string;
};
type Product = {
    id: string; name: string; description: string | null; price: number; originalPrice: number | null;
    priceType: 'FIXED' | 'ON_BUDGET';
    onPromotion: boolean | null; images: string[]; user: any; createdAt: string; category: any;
    boostedUntil: string | null; isService: boolean;
}
type Seller = {
    id: string; name: string | null; storeName: string | null; profileDescription: string | null;
    sellerBannerImageUrl: string | null; image: string | null; whatsappLink: string | null;
    products: Product[];
    reviewsReceived: Review[];
    averageRating: number;
    totalReviews: number;
    showInSellersPage: boolean;
};

// Componente para um único card de avaliação
const ReviewCard = ({ review }: { review: Review }) => (
    <div className="bg-white/5 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:-translate-y-1 group">
        <div className="flex items-center mb-4">
            <Avatar className="h-12 w-12 mr-4 border border-white/20 bg-white/5">
                <AvatarImage src={review.buyer.image || undefined} />
                <AvatarFallback className="font-bold text-white">{review.buyer.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{review.buyer.name}</p>
                <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20')} />
                    ))}
                </div>
            </div>
        </div>
        {review.comment && <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">"{review.comment}"</p>}
    </div>
);

// Componente para os controles de paginação
const PaginationControls = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    const router = useRouter();

    const handlePageChange = (page: number) => {
        router.push(`${basePath}?page=${page}`, { scroll: false });
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 mt-12">
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-full shadow-sm">
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-bold text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-full shadow-sm">
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    );
};


export default function SellerPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const userId = params.userId as string;

    const [seller, setSeller] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentPage = parseInt(searchParams.get('page') || '1');
    const PRODUCTS_PER_PAGE = 10; // 5 por linha em telas grandes

    useEffect(() => {
        if (!userId) return;
        const fetchSellerData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/seller/${userId}`);
                if (!response.ok) {
                    throw new Error('Vendedor não encontrado ou não está visível publicamente.');
                }
                const dataFromApi: Seller = await response.json();
                
                const totalReviews = dataFromApi.reviewsReceived.length;
                const totalRating = dataFromApi.reviewsReceived.reduce((acc: number, review: Review) => acc + review.rating, 0);
                const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

                const completeSellerData: Seller = {
                    ...dataFromApi,
                    averageRating,
                    totalReviews,
                };
                
                setSeller(completeSellerData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSellerData();
    }, [userId, router]);

    const handleShareSellerPage = async () => {
        if (!seller) return;
        if (!session) {
            toast.info("Você precisa de estar logado para criar um link de partilha.");
            router.push(`/auth/signin?callbackUrl=/seller/${seller.id}`);
            return;
        }

        setIsSharing(true);
        try {
            const response = await fetch('/api/shortener', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/${seller.id}`,
                    title: seller.storeName || seller.name,
                    description: seller.profileDescription,
                    imageUrl: seller.sellerBannerImageUrl || seller.image,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Não foi possível criar o link.");
            
            const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${data.shortCode}`;
            navigator.clipboard.writeText(shortUrl);
            toast.success("Link da loja copiado para a área de transferência!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
        } finally {
            setIsSharing(false);
        }
    };

    const { paginatedProducts, totalPages } = useMemo(() => {
        if (!seller) return { paginatedProducts: [], totalPages: 0 };
        const totalPages = Math.ceil(seller.products.length / PRODUCTS_PER_PAGE);
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        const endIndex = startIndex + PRODUCTS_PER_PAGE;
        const paginatedProducts = seller.products.slice(startIndex, endIndex);
        return { paginatedProducts, totalPages };
    }, [seller, currentPage]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                <div className="flex justify-center -mt-16">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
                <div className="text-center mt-6 space-y-4">
                    <Skeleton className="h-10 w-1/2 mx-auto" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                </div>
                 <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            </div>
        )
    }

    if (error || !seller) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-grow flex items-center justify-center text-center p-4">
                    <div>
                        <Ban className="mx-auto h-16 w-16 text-destructive mb-4" />
                        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
                        <p className="text-muted-foreground mt-2">Este perfil de vendedor pode não existir ou não está disponível para visitação.</p>
                        <Button onClick={() => router.push('/sellers')} className="mt-6 rounded-full px-8">Ver outros vendedores</Button>
                    </div>
                </main>
            </div>
        );
    }
    
    return (
      <>
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/30 relative overflow-hidden pb-24">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent pointer-events-none" />

            {/* Top Banner & Profile Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden border-b border-white/5">
                {seller.sellerBannerImageUrl ? (
                    <Image src={seller.sellerBannerImageUrl} alt={`Banner de ${seller.storeName || seller.name}`} fill className="object-cover object-center" priority />
                ) : (
                    <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/30 h-full w-full absolute inset-0"></div>
                )}
                {/* Gradient Overlay for seamless transition */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                {/* Avatar */}
                <div className="flex flex-col items-center -mt-20 md:-mt-24 mb-6">
                    <Avatar className="h-40 w-40 md:h-48 md:w-48 border-8 border-[#050505] shadow-[0_0_40px_rgba(255,255,255,0.05)] bg-white/5 backdrop-blur-xl">
                        <AvatarImage src={seller.image || undefined} className="object-cover" />
                        <AvatarFallback className="text-5xl font-black text-white">{(seller.storeName || seller.name || 'V')[0]}</AvatarFallback>
                    </Avatar>
                </div>

                {/* Seller Info */}
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">{seller.storeName || seller.name}</h1>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl border border-white/10 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{seller.averageRating.toFixed(1)}</span>
                            <span className="opacity-70 font-normal text-white/70">({seller.totalReviews})</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 px-4 py-1.5 rounded-full text-sm font-semibold">
                            {seller.products.length} {seller.products.length === 1 ? 'Anúncio' : 'Anúncios'}
                        </div>
                    </div>

                    {seller.profileDescription && (
                        <p className="text-lg text-white/70 leading-relaxed mb-8 font-light">
                            "{seller.profileDescription}"
                        </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        {seller.whatsappLink && (
                            <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 bg-white/5 hover:bg-green-500/20 text-green-400 hover:text-green-300 font-bold border border-green-500/30 hover:border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 backdrop-blur-md">
                                <a href={seller.whatsappLink} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className='mr-2 h-5 w-5' /> Falar no WhatsApp
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white backdrop-blur-md transition-all duration-300" onClick={handleShareSellerPage} disabled={isSharing}>
                            {isSharing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Share2 className='mr-2 h-4 w-4'/>}
                            Compartilhar Loja
                        </Button>
                    </div>
                </div>
            </div>

            {/* Vitrine de Produtos */}
            <div className="container mx-auto px-4 md:px-8 mt-20 relative z-10">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-black tracking-tight mb-3">Vitrine da Loja</h2>
                    <p className="text-white/60">Tudo o que este vendedor tem para oferecer</p>
                </div>

                {paginatedProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {paginatedProducts.map(product => {
                                const formattedProduct = {
                                    ...product,
                                    categories: product.category ? [product.category] : []
                                };
                                return (
                                    <div key={product.id} className="aspect-[3/4] sm:aspect-auto sm:h-[350px]">
                                        <MiniProductCard product={formattedProduct as any} />
                                    </div>
                                )
                            })}
                        </div>
                        <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath={`/seller/${userId}`} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] w-full max-w-3xl mx-auto shadow-[0_0_40px_rgba(255,255,255,0.02)]">
                        <PackageOpen className="h-16 w-16 text-white/20 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Vazio por enquanto</h3>
                        <p className="text-white/60">Este vendedor ainda não tem produtos ou serviços publicados.</p>
                    </div>
                )}
            </div>

            {/* Avaliações de Clientes */}
            <div className="container mx-auto px-4 md:px-8 mt-24 relative z-10">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-black tracking-tight mb-3">O que os clientes dizem</h2>
                    <p className="text-white/60">Avaliações reais de quem já comprou</p>
                </div>

                {seller.reviewsReceived.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {seller.reviewsReceived.map(review => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 max-w-3xl mx-auto border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.02)]">
                        <MessageCircle className="mx-auto h-12 w-12 text-white/20 mb-4"/>
                        <h3 className="text-lg font-bold mb-2">Sem avaliações</h3>
                        <p className="text-white/60">Seja o primeiro a comprar e avaliar o serviço deste logista!</p>
                    </div>
                )}
            </div>

        </div>
      </>
    )
}
