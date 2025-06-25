"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MessageCircle, ChevronLeft, ChevronRight, Ban, Share2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard, ProductCardSkeleton } from '@/app/products/components/ProductCard'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

// Tipos
type Review = {
    id: string;
    rating: number;
    comment: string | null;
    buyer: { name: string | null; image: string | null; };
};
type Product = {
    id: string; name: string; description: string | null; price: number; originalPrice: number | null;
    onPromotion: boolean | null; images: string[]; user: any; createdAt: string; categories: any[];
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
    <div className="border-b py-4 last:border-b-0">
        <div className="flex items-center mb-2">
            <Avatar className="h-10 w-10 mr-4">
                <AvatarImage src={review.buyer.image || undefined} />
                <AvatarFallback>{review.buyer.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{review.buyer.name}</p>
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                    ))}
                </div>
            </div>
        </div>
        {review.comment && <p className="text-muted-foreground italic">"{review.comment}"</p>}
    </div>
);

// Componente para os controles de paginação
const PaginationControls = ({ currentPage, totalPages, basePath }: { currentPage: number, totalPages: number, basePath: string }) => {
    const router = useRouter();

    const handlePageChange = (page: number) => {
        router.push(`${basePath}?page=${page}`);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
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
    const PRODUCTS_PER_PAGE = 9;

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
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="flex justify-center -mt-16">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
                <div className="text-center mt-6 space-y-4">
                    <Skeleton className="h-10 w-1/2 mx-auto" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                </div>
                 <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            </div>
        )
    }

    if (error || !seller) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow flex items-center justify-center text-center p-4">
                    <div>
                        <Ban className="mx-auto h-16 w-16 text-destructive mb-4" />
                        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
                        <p className="text-muted-foreground mt-2">Este perfil de vendedor pode não existir ou não está disponível para visitação.</p>
                        <Button onClick={() => router.push('/sellers')} className="mt-6">Ver outros vendedores</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    return (
      <>
      <Navbar/>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="relative h-48 md:h-64">
                {seller.sellerBannerImageUrl ? (
                    <Image src={seller.sellerBannerImageUrl} alt={`Banner de ${seller.storeName || seller.name}`} fill className="object-cover" />
                ) : (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 h-full"></div>
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={seller.image || undefined} />
                        <AvatarFallback className="text-4xl">{(seller.storeName || seller.name || 'V')[0]}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                <h1 className="text-4xl font-bold">{seller.storeName || seller.name}</h1>
                {seller.profileDescription && <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">{seller.profileDescription}</p>}
                
                <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Star className="h-6 w-6 text-yellow-400" />
                        <div className="text-left">
                            <p className="font-bold text-lg">{seller.averageRating.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">{seller.totalReviews} {seller.totalReviews === 1 ? 'avaliação' : 'avaliações'}</p>
                        </div>
                    </div>
                    {seller.whatsappLink && (
                        <Button asChild>
                            <a href={seller.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className='mr-2 h-4 w-4' />Contatar</a>
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleShareSellerPage} disabled={isSharing}>
                        {isSharing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Share2 className='h-4 w-4'/>}
                        <span className="hidden sm:inline ml-2">Compartilhar Loja</span>
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16">
                 <div>
                    <h2 className="text-2xl font-bold mb-6">Vitrine de Produtos</h2>
                    {paginatedProducts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {paginatedProducts.map(product => (
                                    <ProductCard key={product.id} product={product as any} />
                                ))}
                            </div>
                            <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath={`/seller/${userId}`} />
                        </>
                    ) : (
                        <p className="text-muted-foreground py-10 text-center">Este vendedor ainda não tem produtos à venda.</p>
                    )}
                </div>

                <div className="mt-16">
                     <h2 className="text-2xl font-bold mb-6">Avaliações de Clientes</h2>
                     {seller.reviewsReceived.length > 0 ? (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                {seller.reviewsReceived.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </CardContent>
                        </Card>
                     ) : (
                        <div className="text-center border rounded-lg py-12">
                            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground"/>
                            <p className="mt-4 text-muted-foreground">Este vendedor ainda não recebeu avaliações.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
      <Footer/>
      </>
    )
}

