'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, HeartCrack, Trash2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// --- NOVOS TIPOS DE DADOS PARA FAVORITOS ---
type ProductInfo = {
  id: string;
  name: string;
  images: string[];
  price: number | null; // Preço pode ser nulo
  priceType: string | null;
};

type FavoriteWithDetails = {
  id: string; // ID do favorito
  createdAt: string;
  product: ProductInfo;
};

// --- NOVO COMPONENTE DE CARD PARA FAVORITOS ---
function FavoriteCard({ favorite, onDelete }: { favorite: FavoriteWithDetails, onDelete: () => void }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <Card className="flex flex-col overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <Link href={`/products/${favorite.product.id}`}>
            <div className="aspect-video w-full relative">
                <Image
                    src={(favorite.product.images && favorite.product.images.length > 0) ? favorite.product.images[0] : '/img-placeholder.png'}
                    alt={favorite.product.name}
                    fill
                    className="object-cover"
                />
            </div>
        </Link>
        <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-lg leading-tight truncate flex-grow">
            <Link href={`/products/${favorite.product.id}`} className="hover:underline">
              {favorite.product.name}
            </Link>
        </h3>
        {favorite.product.priceType === 'ON_BUDGET' || favorite.product.price === null ? (
            <p className="text-xl font-bold text-primary mt-2">A combinar</p>
        ) : (
            <p className="text-xl font-bold text-primary mt-2">
                {formatPrice(favorite.product.price)}
            </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
            Salvo em: {new Date(favorite.createdAt).toLocaleDateString('pt-BR')}
        </p>
        </CardContent>
        <CardFooter className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 gap-2">
            <Button asChild className="w-full">
                <Link href={`/products/${favorite.product.id}`}>Ver Produto</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4"/> Remover
            </Button>
        </CardFooter>
    </Card>
  );
}


export default function MyFavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteToDelete, setFavoriteToDelete] = useState<FavoriteWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/my-favorites'); // Rota atualizada
    }
    if (status === 'authenticated') {
      // --- ATUALIZADO PARA CHAMAR A NOVA API DE FAVORITOS ---
      fetch('/api/my-favorites') // Substitua pela sua rota real se for diferente
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
      // --- ATUALIZADO PARA CHAMAR A API DE DELETAR FAVORITO ---
      const response = await fetch(`/api/favorites/${favoriteToDelete.id}`, { // Substitua pela sua rota real
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

  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <Navbar/>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <header className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Meus Achadinhos Favoritos</h1>
              <p className="mt-2 text-muted-foreground">
                Aqui estão os produtos que você salvou para ver depois.
              </p>
            </header>

            {favorites.length === 0 ? (
              <Card className="text-center py-16 text-muted-foreground border-dashed">
                <HeartCrack className="mx-auto h-16 w-16" />
                <h3 className="mt-4 text-xl font-semibold">Nenhum achadinho salvo</h3>
                <p className="mt-1 text-sm">Explore a loja para encontrar produtos incríveis.</p>
                <Button asChild className="mt-6">
                  <Link href="/products">Ver todos os produtos</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <FavoriteCard 
                    key={favorite.id}
                    favorite={favorite}
                    onDelete={() => setFavoriteToDelete(favorite)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer/>
      </div>

      <Dialog open={!!favoriteToDelete} onOpenChange={(isOpen) => !isOpen && setFavoriteToDelete(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Remoção</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja remover "<strong>{favoriteToDelete?.product.name}</strong>" da sua lista de favoritos?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setFavoriteToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Confirmar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}