'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Inbox, HeartCrack, Trash2 } from 'lucide-react';
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
import { AlertTriangle } from 'lucide-react';

// Tipos de dados
type ProductInfo = {
  id: string;
  name: string;
  images: string[];
  price: number;
};
type UserInfo = {
  name: string | null;
  whatsappLink: string | null;
};
type ReservationWithDetails = {
  id: string;
  createdAt: string;
  product: ProductInfo;
  user: UserInfo; // Este objeto contém os dados do VENDEDOR
};

// Componente para um único card de reserva
function ReservationCard({ reservation, onDelete }: { reservation: ReservationWithDetails, onDelete: () => void }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  // Gera a mensagem personalizada para o WhatsApp
  const whatsappMessage = encodeURIComponent(
    `Ô psit! Beleza, cumpadi? 👋\n\nSalvei seu produto *"${reservation.product.name}"* na minha lista do Zacaplace e queria ver como faço pra gente fechar o negócio. O preço é ${formatPrice(reservation.product.price)}, certo?!\n\n Aguardo seu retorno!`
  );

  const whatsappUrl = `https://wa.me/${reservation.user.whatsappLink?.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <Card className="flex flex-col overflow-hidden">
        <Link href={`/products/${reservation.product.id}`}>
            <div className="aspect-video w-full relative">
                <Image
                    src={(reservation.product.images && reservation.product.images.length > 0) ? reservation.product.images[0] : '/img-placeholder.png'}
                    alt={reservation.product.name}
                    fill
                    className="object-cover"
                />
            </div>
        </Link>
        <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-lg leading-tight truncate flex-grow">
            {reservation.product.name}
        </h3>
        <p className="text-xl font-bold text-primary mt-2">
            {formatPrice(reservation.product.price)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
            Salvo em: {new Date(reservation.createdAt).toLocaleDateString('pt-BR')}
        </p>
        </CardContent>
        <CardFooter className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 gap-2">
            <Button asChild className="w-full bg-green-500 hover:bg-green-600" disabled={!reservation.user?.whatsappLink}>
                <a href={whatsappUrl} target='_blank' rel='noopener noreferrer'>Contactar Vendedor</a>
            </Button>
            <Button variant="outline" className="w-full" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4"/> Remover
            </Button>
        </CardFooter>
    </Card>
  );
}


export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reservationToDelete, setReservationToDelete] = useState<ReservationWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/my-reservations');
    }
    if (status === 'authenticated') {
      fetch('/api/my-reservations')
        .then(res => res.json())
        .then(data => setReservations(Array.isArray(data) ? data : []))
        .catch(() => toast.error('Falha ao carregar suas reservas.'))
        .finally(() => setIsLoading(false));
    }
  }, [status, router]);
  
  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reservations/${reservationToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao remover item da lista.');
      }
      toast.success('Item removido da sua lista!');
      setReservations(prev => prev.filter(r => r.id !== reservationToDelete.id));
      setReservationToDelete(null);
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
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <header className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Meus Achadinhos Salvos</h1>
              <p className="mt-2 text-muted-foreground">
                Aqui estão os produtos que você salvou. Contacte o vendedor para combinar a compra!
              </p>
            </header>

            {reservations.length === 0 ? (
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
                {reservations.map((reservation) => (
                  <ReservationCard 
                    key={reservation.id}
                    reservation={reservation}
                    onDelete={() => setReservationToDelete(reservation)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      <Dialog open={!!reservationToDelete} onOpenChange={(isOpen) => !isOpen && setReservationToDelete(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Remoção</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja remover "<strong>{reservationToDelete?.product.name}</strong>" da sua lista de salvos?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setReservationToDelete(null)} disabled={isDeleting}>Cancelar</Button>
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
