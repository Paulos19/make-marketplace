'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Info, Loader2, Trash2, AlertTriangle, Send, Package, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { AdminNotification, User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Tipos de Metadados
type NotificationMetadata = Prisma.JsonValue & {
  productName?: string;
  productImage?: string;
  purchaseId?: string;
  productId?: string;
  productPrice?: number;
  buyerName?: string;
  quantity?: number;
};

// --- CORREÇÃO 1: O tipo é atualizado para refletir o log ---
type NotificationWithDetails = AdminNotification & {
  metadata: NotificationMetadata | null;
  seller: Pick<User, 'name' | 'id'> | null; // O objeto seller só tem name e id
  sellerWhatsappLink?: string | null;      // O link do whatsapp é um campo separado
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

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    setActionLoading(notificationId, true);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, { method: 'PATCH' });
      if (!response.ok) throw new Error("Falha ao salvar o status.");
      toast.success("Notificação marcada como lida!");
    } catch (error) {
      toast.error("Erro ao marcar como lida. A alteração foi revertida.");
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: false } : n));
    } finally {
      setActionLoading(notificationId, false);
    }
  };

  // --- CORREÇÃO 2: A função agora usa o caminho correto para o link do WhatsApp ---
  const handleContactSeller = (notification: NotificationWithDetails) => {
    const seller = notification.seller;
    
    // A verificação agora usa `notification.sellerWhatsappLink`
    if (!notification.sellerWhatsappLink) {
        toast.error("Este vendedor não possui um número de WhatsApp cadastrado.");
        return;
    }

    const sellerPhone = notification.sellerWhatsappLink.replace(/\D/g, '');
    const productName = notification.metadata?.productName || 'produto';
    const buyerName = notification.metadata?.buyerName || 'um cliente';

    const message = encodeURIComponent(`Olá ${seller?.name || 'vendedor'}, aqui é o Zaca. Notei uma nova reserva para o produto "${productName}" feita por ${buyerName}. Gostaria de confirmar se você já está em contato com o cliente.`);
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Funções de confirmar carrossel e deletar (inalteradas)
  const handleConfirmCarousel = async (notification: NotificationWithDetails) => {
    setActionLoading(notification.id, true);
    try {
      const response = await fetch(`/api/admin/notifications/${notification.id}/confirm-carousel`, { method: 'PATCH' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
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

  // O resto do seu componente permanece funcional
  const renderNotificationContent = (notification: NotificationWithDetails) => {
    const metadata = notification.metadata;
    if (!metadata) return <p className="text-sm">{notification.message}</p>;

    const isCarouselRequest = notification.type === 'CAROUSEL_REQUEST';
    const productName = metadata.productName || 'Produto desconhecido';
    const productImage = metadata.productImage || '/img-placeholder.png';
    const productId = metadata.productId;
    const seller = notification.seller;
    const buyerName = metadata.buyerName || 'Cliente';
    const quantity = metadata.quantity || 1;

    return (
      <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
        <div className="w-full sm:w-32 h-32 flex-shrink-0 relative">
          <Image src={productImage} alt={productName} fill className="rounded-md object-cover border" />
        </div>
        <div className="text-sm space-y-2 flex-grow">
          <p>
            <span className="font-semibold">Produto:</span>{' '}
            {productId ? (<Link href={`/products/${productId}`} target="_blank" className="text-blue-600 hover:underline">{productName}</Link>) : (<span>{productName}</span>)}
            {!isCarouselRequest && <span> (x{quantity})</span>}
          </p>
          <p>
            <span className="font-semibold">Vendedor:</span>{' '}
            {seller?.id ? (<Link href={`/seller/${seller.id}`} target="_blank" className="text-blue-600 hover:underline">{seller.name}</Link>) : ('Vendedor não encontrado')}
          </p>
          {!isCarouselRequest && (<p><span className="font-semibold">Comprador:</span> {buyerName}</p>)}
          {isCarouselRequest && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">URL da Imagem:</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(productImage || '')}><Copy className="h-4 w-4" /></Button>
              <a href={productImage || ''} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="h-4 w-4" /></Button></a>
            </div>
          )}
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
            <Card key={notification.id} className={cn("transition-all", notification.isRead ? "opacity-60 bg-slate-50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-800/80 shadow-md", notification.type === 'CAROUSEL_REQUEST' && !notification.isRead && "border-red-500", notification.type === 'RESERVATION' && !notification.isRead && "border-blue-500")}>
              <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                      <CardTitle className="text-base font-semibold">{notification.type === 'CAROUSEL_REQUEST' ? `Solicitação de Carrossel` : `Nova Reserva`}</CardTitle>
                      <CardDescription className="text-xs">{new Date(notification.createdAt).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</CardDescription>
                  </div>
                  {notification.isRead && <Badge variant="secondary">Concluída</Badge>}
              </CardHeader>
              <CardContent>{renderNotificationContent(notification)}</CardContent>
              <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setNotificationToDelete(notification)}><Trash2 className="h-4 w-4" /></Button>
                  {!notification.isRead && (
                    <>
                      {notification.type === 'RESERVATION' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleContactSeller(notification)} disabled={isLoading[notification.id]}><MessageSquare className="mr-2 h-4 w-4" /> Contatar Vendedor</Button>
                          <Button size="sm" onClick={() => handleMarkAsRead(notification.id)} disabled={isLoading[notification.id]}>{isLoading[notification.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />} Marcar como Lida</Button>
                        </>
                      )}
                      {notification.type === 'CAROUSEL_REQUEST' && (<Button size="sm" onClick={() => handleConfirmCarousel(notification)} disabled={isLoading[notification.id]}>{isLoading[notification.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />} Confirmar Postagem</Button>)}
                    </>
                  )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      <Dialog open={!!notificationToDelete} onOpenChange={(isOpen) => !isOpen && setNotificationToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir esta notificação? A ação é irreversível.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setNotificationToDelete(null)} disabled={isLoading[notificationToDelete?.id || '']}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading[notificationToDelete?.id || '']}>{isLoading[notificationToDelete?.id || ''] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Confirmar Exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}