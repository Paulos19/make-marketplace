'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Inbox, Trash2, AlertTriangle, User, Calendar, MessageSquare, ShoppingBag, CheckCircle2, TrendingUp, XCircle, Clock } from 'lucide-react';
import { ReservationStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ProductInfo = {
    id: string;
    name: string;
    images: string[];
};
type UserInfo = {
    name: string | null;
    whatsappLink: string | null;
};
type ReservationWithDetails = {
    id: string;
    status: ReservationStatus;
    createdAt: string;
    product: ProductInfo;
    user: UserInfo;
};

export default function SalesPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionStates, setActionStates] = useState<Record<string, boolean>>({});
    const [reservationToDelete, setReservationToDelete] = useState<ReservationWithDetails | null>(null);

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/auth/signin');
        if (authStatus === 'authenticated') {
            fetch('/api/sales')
                .then(res => res.json())
                .then(data => setReservations(Array.isArray(data) ? data : []))
                .catch(() => toast.error('Falha ao carregar o histórico de vendas.'))
                .finally(() => setIsLoading(false));
        }
    }, [authStatus, router]);

    const setActionLoading = (id: string, state: boolean) => {
        setActionStates(prev => ({ ...prev, [id]: state }));
    }

    const handleUpdateStatus = async (reservationId: string, newStatus: ReservationStatus) => {
        setActionLoading(reservationId, true);
        try {
            const response = await fetch(`/api/sales/${reservationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const updatedReservation = await response.json();
            if (!response.ok) throw new Error(updatedReservation.error || 'Falha ao atualizar o status.');
            setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: updatedReservation.status } : r));
            toast.success(`Reserva atualizada para "${newStatus.toString()}"!`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
        } finally {
            setActionLoading(reservationId, false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!reservationToDelete) return;
        setActionLoading(reservationToDelete.id, true);
        try {
            const response = await fetch(`/api/sales/${reservationToDelete.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || "Falha ao excluir.");
            toast.success("Registo de reserva excluído com sucesso.");
            setReservations(prev => prev.filter(r => r.id !== reservationToDelete.id));
            setReservationToDelete(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
        } finally {
            setActionLoading(reservationToDelete.id, false);
        }
    };

    const getStatusInfo = (status: ReservationStatus) => {
        switch (status) {
            case 'SOLD': return { label: 'Concluída', color: 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800' };
            case 'PENDING': return { label: 'Pendente', color: 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800' };
            case 'CANCELED': return { label: 'Cancelada', color: 'text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800' };
            default: return { label: status, color: 'text-slate-700 bg-slate-100 border-slate-200' };
        }
    };

    if (authStatus === 'loading') {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    // Calculate Metrics
    const totalReservations = reservations.length;
    const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
    const soldCount = reservations.filter(r => r.status === 'SOLD').length;
    const conversionRate = totalReservations > 0 ? Math.round((soldCount / totalReservations) * 100) : 0;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">

            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start text-left">
                    <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4">
                        Gestão de Pedidos
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">As Suas Vendas</h1>
                    <p className="text-white/70 max-w-lg">
                        Acompanhe o interesse nos seus produtos, responda aos clientes via WhatsApp e atualize o estado das transações.
                    </p>
                </div>

                <div className="relative z-10 shrink-0">
                    <div className="flex items-center gap-2 text-emerald-200 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                        <ShoppingBag className="h-5 w-5" />
                        <span className="font-semibold text-lg">{totalReservations} Pedidos</span>
                    </div>
                </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Reservas Totais</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : totalReservations}</div>
                        <p className="text-xs text-slate-500 mt-1">Interesses gerados</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Aguardando Resposta</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : pendingCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Requerem a sua atenção</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Vendas Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : soldCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Negócios fechados</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Taxa de Sucesso</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : `${conversionRate}%`}</div>
                        <p className="text-xs text-slate-500 mt-1">Reservas que viraram vendas</p>
                    </CardContent>
                </Card>
            </div>

            {/* LISTA DE RESERVAS (Tabela de Produtos) */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
                    <CardDescription>Atualize o estado das reservas assim que entrar em contacto com o cliente.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                    ) : reservations.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                            <Inbox className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Caixa de Entrada Vazia</h3>
                            <p className="text-sm mb-6 max-w-sm">Quando um cliente demonstrar interesse num produto seu, o pedido aparecerá aqui.</p>
                            <Button asChild variant="outline"><Link href="/dashboard">Voltar ao Painel</Link></Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reservations.map((reservation) => {
                                const statusInfo = getStatusInfo(reservation.status);
                                const isPending = reservation.status === 'PENDING';

                                return (
                                    <div key={reservation.id} className={cn("flex flex-col xl:flex-row xl:items-center gap-4 p-4 transition-colors", isPending ? "bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/50")}>

                                        {/* Info do Produto */}
                                        <div className="flex items-center gap-4 flex-grow min-w-0">
                                            <Link href={`/products/${reservation.product.id}`} target="_blank" className="shrink-0">
                                                <div className="h-16 w-16 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm hover:scale-105 transition-transform">
                                                    <Image src={(reservation.product.images && reservation.product.images.length > 0) ? reservation.product.images[0] : '/img-placeholder.png'} alt={reservation.product.name} fill className="object-cover" />
                                                </div>
                                            </Link>
                                            <div className="min-w-0">
                                                <Link href={`/products/${reservation.product.id}`} target="_blank" className="hover:underline">
                                                    <h4 className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">{reservation.product.name}</h4>
                                                </Link>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium"><User className="w-3 h-3" /> {reservation.user.name || 'Cliente Sem Nome'}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(reservation.createdAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ações e Status */}
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-3 xl:pt-0 border-t xl:border-0 border-slate-100 dark:border-slate-800 mt-2 xl:mt-0">

                                            <div className="w-[140px] shrink-0">
                                                <Select
                                                    value={reservation.status}
                                                    onValueChange={(newStatus: ReservationStatus) => handleUpdateStatus(reservation.id, newStatus)}
                                                    disabled={actionStates[reservation.id]}
                                                >
                                                    <SelectTrigger className={cn("h-9 font-medium text-xs border", statusInfo.color)}>
                                                        <SelectValue>
                                                            {actionStates[reservation.id] ? (
                                                                <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Atualizando...</div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    {reservation.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                                    {reservation.status === 'SOLD' && <CheckCircle2 className="w-3 h-3" />}
                                                                    {reservation.status === 'CANCELED' && <XCircle className="w-3 h-3" />}
                                                                    {statusInfo.label}
                                                                </div>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ReservationStatus.PENDING} className="text-amber-700 font-medium"><div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Pendente</div></SelectItem>
                                                        <SelectItem value={ReservationStatus.SOLD} className="text-emerald-700 font-medium"><div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Concluída</div></SelectItem>
                                                        <SelectItem value={ReservationStatus.CANCELED} className="text-red-700 font-medium"><div className="flex items-center gap-2"><XCircle className="w-3 h-3" /> Cancelada</div></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {reservation.user.whatsappLink ? (
                                                <Button asChild size="sm" className="h-9 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-sm border-none">
                                                    <a href={reservation.user.whatsappLink} target="_blank" rel="noopener noreferrer">
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                        WhatsApp
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button disabled size="sm" variant="outline" className="h-9">Sem Contato</Button>
                                            )}

                                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setReservationToDelete(reservation)}>
                                                <Trash2 className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* DELETE MODAL */}
            <Dialog open={!!reservationToDelete} onOpenChange={(isOpen) => !isOpen && setReservationToDelete(null)}>
                <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o registo desta reserva do <strong>{reservationToDelete?.product.name}</strong>? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setReservationToDelete(null)} disabled={actionStates[reservationToDelete?.id || '']}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionStates[reservationToDelete?.id || '']}>
                            {actionStates[reservationToDelete?.id || ''] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Confirmar Exclusão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
