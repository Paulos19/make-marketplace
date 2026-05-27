'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, HeartCrack, Trash2, AlertTriangle, Heart, ExternalLink, Calendar, CircleDollarSign } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ProductInfo = {
  id: string;
  name: string;
  images: string[];
  price: number | null;
  priceType: string | null;
};

type FavoriteWithDetails = {
  id: string;
  createdAt: string;
  product: ProductInfo;
};

export default function MyFavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteToDelete, setFavoriteToDelete] = useState<FavoriteWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/my-reservations');
    }
    if (status === 'authenticated') {
      fetch('/api/my-favorites')
        .then(res => {
          if (!res.ok) throw new Error('Falha ao carregar seus favoritos.');
          return res.json();
        })
        .then(data => setFavorites(Array.isArray(data) ? data : []))
        .catch((err) => toast.error(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [status, router]);

  const handleConfirmDelete = async () => {
    if (!favoriteToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/favorites/${favoriteToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao remover item da lista.');
      }
      toast.success('Item removido dos seus favoritos!');
      setFavorites(prev => prev.filter(f => f.id !== favoriteToDelete.id));
      setFavoriteToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalFavorites = favorites.length;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full">
        
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 to-slate-900 text-white shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start text-left">
                <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4 px-3 py-1">
                    Coleção Pessoal
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Meus Favoritos</h1>
                <p className="text-white/70 max-w-lg">
                    Acompanhe os achadinhos que guardou para mais tarde. Volte aqui para comparar e fechar negócio quando estiver pronto.
                </p>
            </div>

            <div className="relative z-10 shrink-0">
                 <div className="flex items-center gap-2 text-rose-200 bg-black/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                    <Heart className="h-6 w-6 fill-rose-500/20" />
                    <div className="flex flex-col">
                        <span className="font-black text-2xl leading-none">{totalFavorites}</span>
                        <span className="text-xs uppercase tracking-wider opacity-80">Itens Salvos</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* LIST VIEW */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Os Seus Achadinhos
                </CardTitle>
                <CardDescription>Lista dos produtos que marcaram o seu interesse.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {favorites.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                        <HeartCrack className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 text-lg mb-2">A sua lista está vazia</h3>
                        <p className="text-sm mb-6 max-w-md">Navegue pela loja e clique no coração dos produtos que mais gosta para os guardar aqui.</p>
                        <Button asChild variant="default" className="shadow-sm">
                            <Link href="/products">Explorar Produtos</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {favorites.map((favorite) => (
                            <div key={favorite.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                
                                {/* Info do Produto */}
                                <div className="flex items-center gap-4 flex-grow min-w-0">
                                    <Link href={`/products/${favorite.product.id}`} className="shrink-0 block">
                                        <div className="h-20 w-20 sm:h-16 sm:w-16 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                                            <Image src={(favorite.product.images && favorite.product.images.length > 0) ? favorite.product.images[0] : '/img-placeholder.png'} alt={favorite.product.name} fill className="object-cover" />
                                        </div>
                                    </Link>
                                    <div className="min-w-0">
                                        <Link href={`/products/${favorite.product.id}`} className="hover:underline">
                                            <h4 className="font-bold text-base sm:text-sm truncate text-slate-900 dark:text-slate-100">{favorite.product.name}</h4>
                                        </Link>
                                        
                                        {/* Preço (Mobile & Desktop) */}
                                        <div className="flex items-center gap-3 mt-1 text-sm sm:text-xs">
                                            {favorite.product.priceType === 'ON_BUDGET' || favorite.product.price === null ? (
                                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">A combinar</Badge>
                                            ) : (
                                                <span className="font-bold text-primary flex items-center gap-1">
                                                    <CircleDollarSign className="w-3 h-3" />
                                                    {formatPrice(favorite.product.price)}
                                                </span>
                                            )}
                                            
                                            <span className="flex items-center gap-1 text-slate-400 hidden sm:flex">
                                                <Calendar className="w-3 h-3"/> 
                                                Salvo em: {new Date(favorite.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                                    <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                                        <Link href={`/products/${favorite.product.id}`}>
                                            <ExternalLink className="w-4 h-4 mr-2 sm:mr-0 xl:mr-2" />
                                            <span className="sm:hidden xl:inline">Ver Produto</span>
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0" onClick={() => setFavoriteToDelete(favorite)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* DELETE MODAL */}
        <Dialog open={!!favoriteToDelete} onOpenChange={(isOpen) => !isOpen && setFavoriteToDelete(null)}>
            <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5"/>Confirmar Remoção</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja remover "<strong>{favoriteToDelete?.product.name}</strong>" da sua lista de favoritos? Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={() => setFavoriteToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Remover Favorito
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}