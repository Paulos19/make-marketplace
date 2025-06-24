'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Info, Loader2, Trash2, AlertTriangle, Send, Package, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { AdminNotification, Reservation, Product, User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type NotificationMetadata = Prisma.JsonValue & {
  productName?: string;
  productImage?: string;
  purchaseId?: string;
  productId?: string;
  productPrice?: number;
};

type NotificationWithDetails = AdminNotification & {
  metadata: NotificationMetadata | null;
  seller: Pick<User, 'name' | 'email' | 'storeName' | 'id'> | null;
};

interface NotificationClientProps {
  initialNotifications: NotificationWithDetails[];
}

export function NotificationClient({ initialNotifications }: NotificationClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationWithDetails | null>(null);

  const setActionLoading = (id: string, state: boolean) => {
    setIsLoading(prev => ({ ...prev, [id]: state }));
  }

  const handleConfirmCarousel = async (notification: NotificationWithDetails) => {
    setActionLoading(notification.id, true);
    try {
      const response = await fetch(`/api/admin/notifications/${notification.id}/confirm-carousel`, { method: 'PATCH' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success(data.message);
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao confirmar a divulgação.");
    } finally {
      setActionLoading(notification.id, false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;
    setActionLoading(notificationToDelete.id, true);
    try {
        await fetch(`/api/admin/notifications/${notificationToDelete.id}`, { method: 'DELETE' });
        toast.success("Notificação excluída com sucesso.");
        setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
        setNotificationToDelete(null);
    } catch (error) {
        toast.error("Falha ao excluir a notificação.");
    } finally {
        setActionLoading(notificationToDelete.id, false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL da imagem copiada!");
  }

  const renderCarouselRequestCard = (notification: NotificationWithDetails) => {
    const metadata = notification.metadata;
    if (!metadata) return null;

    return (
      <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
        <div className="w-full sm:w-32 h-32 flex-shrink-0 relative">
          <Image 
            src={metadata.productImage || '/img-placeholder.png'} 
            alt={metadata.productName || 'Produto'} 
            fill 
            className="rounded-md object-cover border"
          />
        </div>
        <div className="text-sm space-y-2">
          <p>
            <span className="font-semibold">Produto:</span>{' '}
            <Link href={`/products/${metadata.productId}`} target="_blank" className="text-blue-600 hover:underline">{metadata.productName}</Link>
          </p>
          <p>
            <span className="font-semibold">Vendedor:</span>{' '}
            <Link href={`/seller/${notification.seller?.id}`} target="_blank" className="text-blue-600 hover:underline">{notification.seller?.storeName || notification.seller?.name}</Link>
          </p>
          <p>
            <span className="font-semibold">Preço:</span>{' '}
            {metadata.productPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-semibold">URL da Imagem:</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(metadata.productImage || '')}>
              <Copy className="h-4 w-4" />
            </Button>
            <a href={metadata.productImage || ''} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mt-6">
        {notifications.length === 0 ? (
          <Card className="text-center p-8"><Info className="mx-auto h-10 w-10 text-slate-400 mb-4"/><CardTitle>Tudo em ordem!</CardTitle><CardDescription>Nenhuma notificação pendente.</CardDescription></Card>
        ) : (
          notifications.map(notification => (
            <Card key={notification.id} className={cn(
                "transition-opacity",
                notification.isRead ? "opacity-60 bg-slate-50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-800/80",
                notification.type === 'CAROUSEL_REQUEST' && !notification.isRead && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50"
            )}>
              <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                      <CardTitle className="text-base font-semibold">
                        {notification.type === 'CAROUSEL_REQUEST' ? `Solicitação de Carrossel` : `Nova Reserva`}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(notification.createdAt).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}
                      </CardDescription>
                  </div>
                  {notification.isRead && <Badge variant="secondary">Concluída</Badge>}
              </CardHeader>
              <CardContent>
                {notification.type === 'CAROUSEL_REQUEST' 
                    ? renderCarouselRequestCard(notification) 
                    : <p className="text-sm">{notification.message}</p>
                }
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setNotificationToDelete(notification)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  {notification.type === 'CAROUSEL_REQUEST' && !notification.isRead && (
                     <Button size="sm" onClick={() => handleConfirmCarousel(notification)} disabled={isLoading[notification.id]}>
                        {isLoading[notification.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                        Confirmar Postagem
                    </Button>
                  )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={!!notificationToDelete} onOpenChange={(isOpen) => !isOpen && setNotificationToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
                Tem certeza que deseja excluir esta notificação? A ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setNotificationToDelete(null)} disabled={isLoading[notificationToDelete?.id || '']}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading[notificationToDelete?.id || '']}>
                {isLoading[notificationToDelete?.id || ''] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
