"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit3, AlertTriangle, Loader2, LinkIcon, Trash2, Crown, Rocket, Zap, Send, Clock, Store, Eye, TrendingUp, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SubscriptionStatus, PurchaseType, Product } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// --- Tipos de Dados ---
interface PurchaseInfo { id: string; createdAt: string; }
interface BoostedProductInfo { id: string; name: string; boostedUntil: string; }
interface UserStatusData {
    hasActiveSubscription: boolean;
    subscriptionEndDate: string | null;
    boostedProducts: BoostedProductInfo[];
    availableCarouselPurchases: PurchaseInfo[];
}

// --- Funções Auxiliares ---
function getTimeRemaining(endDate: string | Date | null): string {
    if (!endDate) return "Sem expiração";
    const now = new Date();
    const end = new Date(endDate);
    const diffInMs = end.getTime() - now.getTime();
    if (diffInMs <= 0) return "Expirado";
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays > 1) return `Expira em ${diffInDays} d`;
    if (diffInDays === 1) return `Expira em 1 dia`;
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
    if (diffInHours > 1) return `Expira em ${diffInHours} h`;
    return `Expira em 1 hora`;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- Sub-Componentes ---

const CarouselRequestCard = ({ purchases, onSubmission }: { purchases: PurchaseInfo[], onSubmission: () => void }) => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/products?userId=${session.user.id}&isService=false`)
                .then(res => res.json())
                .then(data => setProducts(data.products || []))
                .catch(err => console.error(err));
        }
    }, [session]);

    const handleSubmit = async () => {
        if (!selectedProductId) return toast.error("Selecione um produto.");
        const purchaseId = purchases[0]?.id;
        if (!purchaseId) return toast.error("Nenhuma compra de carrossel válida.");

        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/carousel-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: selectedProductId, purchaseId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Falha.");
            toast.success(data.message);
            onSubmission();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-l-4 border-red-500 overflow-hidden shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                    <Zap className="h-5 w-5 text-red-500" />
                    Carrossel na Praça
                </CardTitle>
                <CardDescription className="text-xs">
                    Você tem <strong className="text-foreground">{purchases.length}</strong> crédito(s). Promova no Insta!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
                <Select onValueChange={setSelectedProductId} value={selectedProductId || ''}>
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Escolha um produto..." />
                    </SelectTrigger>
                    <SelectContent>
                        {products.length > 0 ? (
                            products.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))
                        ) : (
                            <p className="p-2 text-xs text-muted-foreground">Nenhum produto encontrado.</p>
                        )}
                    </SelectContent>
                </Select>
                <Button onClick={handleSubmit} disabled={isLoading || !selectedProductId} size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                    Enviar para Divulgação
                </Button>
            </CardContent>
        </Card>
    );
};

// --- Componente Principal ---

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Dados de Produtos
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [boostingProductId, setBoostingProductId] = useState<string | null>(null);

    // Dados de Status (UserStatusCard Logic integrado)
    const [statusData, setStatusData] = useState<UserStatusData | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    const userId = useMemo(() => session?.user?.id, [session]);

    const fetchStatus = useCallback(() => {
        setIsLoadingStatus(true);
        fetch('/api/user/status')
            .then(res => res.json())
            .then(data => setStatusData(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoadingStatus(false));
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/signin');
        if (status === 'authenticated' && userId) {
            setIsLoadingProducts(true);
            fetch(`/api/products?userId=${userId}`)
                .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha')))
                .then(data => setProducts(Array.isArray(data.products) ? data.products : []))
                .catch(err => console.error(err))
                .finally(() => setIsLoadingProducts(false));

            fetchStatus();
        }
    }, [status, userId, router, fetchStatus]);

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/products/${productToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar o produto');
            setProducts(products.filter((p) => p.id !== productToDelete.id));
            toast.success('Produto excluído com sucesso!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao deletar produto');
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    const handleBoostCheckout = async (productId: string) => {
        if (!process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID) return toast.error("Plano Turbo não configurado.");
        setBoostingProductId(productId);
        try {
            const response = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID, type: 'payment', productId })
            });
            const { url, error } = await response.json();
            if (!response.ok || !url) throw new Error(error || "Erro no checkout.");
            window.location.href = url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro.");
            setBoostingProductId(null);
        }
    };

    if (status === 'loading') {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const hasAvailableCarousel = statusData?.availableCarouselPurchases && statusData.availableCarouselPurchases.length > 0;
    const activeProductsCount = products.filter(p => !p.isSold).length;
    const reservedProductsCount = products.filter(p => p.isReserved).length;
    const turboProductsCount = statusData?.boostedProducts.length || 0;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">

            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start text-left">
                    <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4">
                        {statusData?.hasActiveSubscription ? 'Membro Pro' : 'Conta Grátis'}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Bem-vindo de volta, {session?.user?.name?.split(' ')[0]}!</h1>
                    <p className="text-white/70 max-w-lg">
                        Aqui está o resumo da sua loja. Acompanhe as suas métricas, impulsione os seus achadinhos e impulsione as suas vendas.
                    </p>
                </div>

                <div className="relative z-10 shrink-0">
                    <Button asChild size="lg" className="rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform bg-white text-indigo-900 hover:bg-slate-100">
                        <Link href="/dashboard/add-product"><PlusCircle className="mr-2 h-5 w-5" /> Adicionar Produto</Link>
                    </Button>
                </div>
            </div>

            {/* METRICS ROW (Grafana Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Itens Ativos</CardTitle>
                        <Store className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{isLoadingProducts ? <Skeleton className="h-8 w-16" /> : activeProductsCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Prontos a vender</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Reservas Pendentes</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{isLoadingProducts ? <Skeleton className="h-8 w-16" /> : reservedProductsCount}</div>
                        <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Aguardando fecho</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Impulsos Ativos</CardTitle>
                        <Rocket className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{isLoadingStatus ? <Skeleton className="h-8 w-16" /> : turboProductsCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Produtos turbinados</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-100 transition-opacity">
                        <Badge variant="secondary" className="shadow-md">Em Breve</Badge>
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 opacity-50">
                        <CardTitle className="text-sm font-medium text-slate-500">Visitas ao Perfil</CardTitle>
                        <Eye className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="opacity-50">
                        <div className="text-3xl font-black">--</div>
                        <p className="text-xs text-slate-500 mt-1">Dados de tráfego</p>
                    </CardContent>
                </Card>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA (Tabela de Produtos) */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800 flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <CardTitle className="text-lg">Inventário da Loja</CardTitle>
                                <CardDescription>Gerencie seus achadinhos e impulsione suas vendas.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingProducts ? (
                                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                            ) : products.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                                    <Store className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Sem produtos ainda</h3>
                                    <p className="text-sm mb-6">Comece por adicionar o seu primeiro achadinho.</p>
                                    <Button asChild><Link href="/dashboard/add-product">Adicionar Agora</Link></Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {products.map((product) => {
                                        const isBoosted = statusData?.boostedProducts.some(bp => bp.id === product.id);
                                        return (
                                            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <div className="h-16 w-16 relative rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                    {product.images && product.images[0] ? (
                                                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-slate-300" /></div>
                                                    )}
                                                </div>

                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">{product.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-xs font-semibold text-primary">
                                                            {product.priceType === 'ON_BUDGET' ? 'Sob Consulta' : formatCurrency(product.price || 0)}
                                                        </span>
                                                        {product.isSold && <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600">Vendido</Badge>}
                                                        {product.isReserved && <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-amber-600 border-amber-200 bg-amber-50">Reservado</Badge>}
                                                        {isBoosted && <Badge className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"><Rocket className="w-3 h-3 mr-1" /> Turbo</Badge>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {!isBoosted && !product.isSold && (
                                                        <Button size="sm" variant="outline" className="h-8 bg-blue-50/50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleBoostCheckout(product.id)} disabled={boostingProductId === product.id}>
                                                            {boostingProductId === product.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Rocket className="h-3 w-3 mr-1" />}
                                                            <span className="hidden sm:inline">Turbinar</span>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0"><Link href={`/products/${product.id}`}><LinkIcon className="h-4 w-4 text-slate-400" /></Link></Button>
                                                    <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0"><Link href={`/dashboard/edit-product/${product.id}`}><Edit3 className="h-4 w-4 text-slate-400" /></Link></Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50" onClick={() => setProductToDelete(product)}><Trash2 className="h-4 w-4 text-slate-400" /></Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* COLUNA DIREITA (Status & Marketing) */}
                <div className="xl:col-span-1 space-y-6">
                    {hasAvailableCarousel && <CarouselRequestCard purchases={statusData!.availableCarouselPurchases} onSubmission={fetchStatus} />}

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                Assinaturas & Planos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {isLoadingStatus ? (
                                <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                            ) : (
                                <>
                                    {!statusData?.hasActiveSubscription && (!statusData?.boostedProducts || statusData.boostedProducts.length === 0) && (
                                        <p className="text-sm text-slate-500 text-center py-4">Nenhum plano ativo.</p>
                                    )}

                                    {statusData?.hasActiveSubscription && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                                                <Crown className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Catálogo Pro</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Renova: {statusData.subscriptionEndDate ? new Date(statusData.subscriptionEndDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {statusData?.boostedProducts && statusData.boostedProducts.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Boosts Ativos</p>
                                            {statusData.boostedProducts.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div className="truncate pr-2">
                                                        <p className="text-sm font-medium truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {getTimeRemaining(p.boostedUntil)}</p>
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0 border-none shadow-none"><Rocket className="w-3 h-3" /></Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4">
                            <Button asChild variant="outline" className="w-full bg-white dark:bg-slate-950">
                                <Link href="/planos">Ver todos os Planos</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* DELETE MODAL */}
            <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Remover Produto</DialogTitle>
                        <DialogDescription>Tem certeza que deseja apagar "<strong>{productToDelete?.name}</strong>"? Esta ação não pode ser desfeita.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setProductToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Confirmar Exclusão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
