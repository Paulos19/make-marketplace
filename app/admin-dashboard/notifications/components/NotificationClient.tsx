'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Check, Info, MessageSquare, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { AdminNotification, Reservation, Product, User } from '@prisma/client';

type NotificationWithDetails = AdminNotification & {
  reservation: Reservation & {
    product: Pick<Product, 'name' | 'images'>;
    user: Pick<User, 'name'>;
  };
  seller: Pick<User, 'name'>;
};

interface NotificationClientProps {
  initialNotifications: NotificationWithDetails[];
}

export function NotificationClient({ initialNotifications }: NotificationClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationWithDetails | null>(null);
  const router = useRouter();

  const handleNotifySeller = (notification: NotificationWithDetails) => {
    if (!notification.sellerWhatsappLink) {
      toast.error("Este vendedor não possui um número de WhatsApp cadastrado.");
      return;
    }
    const whatsappUrl = `https://wa.me/${notification.sellerWhatsappLink.replace(/\D/g, '')}?text=${encodeURIComponent(notification.message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    setIsLoading(notificationId);
    try {
      await fetch(`/api/admin/notifications/${notificationId}`, { method: 'PATCH' });
      toast.success("Notificação marcada como lida.");
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error("Falha ao marcar como lida.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;
    setIsLoading(notificationToDelete.id);
    try {
        await fetch(`/api/admin/notifications/${notificationToDelete.id}`, { method: 'DELETE' });
        toast.success("Notificação excluída com sucesso.");
        setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
        setNotificationToDelete(null);
    } catch (error) {
        toast.error("Falha ao excluir a notificação.");
    } finally {
        setIsLoading(null);
    }
  }

  return (
    <>
      <div className="space-y-4 mt-6">
        {notifications.length === 0 ? (
          <Card className="text-center p-8"><Info className="mx-auto h-10 w-10 text-slate-400 mb-4"/><CardTitle>Tudo em ordem!</CardTitle><CardDescription>Nenhuma notificação pendente.</CardDescription></Card>
        ) : (
          notifications.map(notification => (
            <Card key={notification.id} className={notification.isRead ? "opacity-60 bg-slate-50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-800/80"}>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle className="text-base font-semibold">Nova Reserva para {notification.seller.name}</CardTitle>
                      <CardDescription className="text-xs">{new Date(notification.createdAt).toLocaleString('pt-BR')}</CardDescription>
                  </div>
                  {notification.isRead && <Badge variant="secondary">Lida</Badge>}
              </CardHeader>
              <CardContent>
                <p className="border-l-4 border-zaca-azul pl-4 text-sm">{notification.message}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setNotificationToDelete(notification)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleNotifySeller(notification)} disabled={!notification.sellerWhatsappLink}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Notificar
                  </Button>
                  {!notification.isRead && (
                      <Button variant="secondary" size="sm" onClick={() => handleMarkAsRead(notification.id)} disabled={!!isLoading}>
                          {isLoading === notification.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                          Marcar como Lida
                      </Button>
                  )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Diálogo de Confirmação para Exclusão */}
      <Dialog open={!!notificationToDelete} onOpenChange={(isOpen) => !isOpen && setNotificationToDelete(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja excluir esta notificação? A reserva associada não será afetada.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="secondary" disabled={isLoading === notificationToDelete?.id}>Cancelar</Button></DialogClose>
                <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isLoading === notificationToDelete?.id}>
                    {isLoading === notificationToDelete?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sim, excluir
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
