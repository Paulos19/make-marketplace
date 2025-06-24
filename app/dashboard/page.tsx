"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, PlusCircle, Settings, LogOut, Menu, UserCircle2, ShoppingBag, Edit3, AlertTriangle, Loader2, LinkIcon, Trash2, Crown, Rocket, Zap, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SubscriptionStatus, PurchaseType } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// --- Tipos de Dados ---
interface Product {
  id: string;
  name: string;
  images: string[];
  description?: string | null;
  price: number;
  createdAt: string;
}

interface PurchaseInfo {
    id: string;
    createdAt: string;
}

interface BoostedProductInfo {
    id: string;
    name: string;
    boostedUntil: string;
}

interface UserStatusData {
  hasActiveSubscription: boolean;
  subscriptionEndDate: string | null;
  boostedProducts: BoostedProductInfo[];
  availableCarouselPurchases: PurchaseInfo[];
}

// --- Funções Auxiliares e Sub-Componentes ---

function getTimeRemaining(endDate: string | Date | null): string {
    if (!endDate) return "Sem data de expiração";
    const now = new Date();
    const end = new Date(endDate);
    const diffInMs = end.getTime() - now.getTime();

    if (diffInMs <= 0) return "Expirado";

    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays > 1) return `Expira em ${diffInDays} dias`;
    if (diffInDays === 1) return `Expira em 1 dia`;

    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
    if (diffInHours > 1) return `Expira em ${diffInHours} horas`;
    return `Expira em 1 hora`;
}

const CarouselRequestCard = ({ purchases, onSubmission }: { purchases: PurchaseInfo[], onSubmission: () => void }) => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProducts, setIsFetchingProducts] = useState(true);

    useEffect(() => {
        if(session?.user?.id) {
            setIsFetchingProducts(true);
            fetch(`/api/products?userId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setProducts(data))
                .catch(err => console.error("Falha ao buscar produtos do vendedor", err))
                .finally(() => setIsFetchingProducts(false));
        }
    }, [session]);

    const handleSubmit = async () => {
        if (!selectedProductId) {
            toast.error("Por favor, selecione um produto para divulgar.");
            return;
        }
        
        const purchaseId = purchases[0]?.id;
        if (!purchaseId) {
            toast.error("Nenhuma compra de carrossel válida encontrada.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/carousel-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: selectedProductId, purchaseId }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Falha ao enviar solicitação.");
            
            toast.success(data.message);
            onSubmission(); 
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-800 dark:text-red-300">
                    <Zap className="h-6 w-6 text-red-500" />
                    Divulgação no "Carrossel na Praça"
                </CardTitle>
                <CardDescription>
                    Você tem {purchases.length} divulgação(ões) disponível(is)! Escolha um produto abaixo para ser destacado no Instagram do Zacaplace.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select onValueChange={setSelectedProductId} value={selectedProductId || ''} disabled={isFetchingProducts}>
                    <SelectTrigger>
                        <SelectValue placeholder={isFetchingProducts ? "Carregando seus produtos..." : "Selecione um produto..."} />
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
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} disabled={isLoading || !selectedProductId} className="bg-red-600 hover:bg-red-700">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar para Divulgação
                </Button>
            </CardFooter>
        </Card>
    );
};

const UserStatusCard = () => {
    const [statusData, setStatusData] = useState<UserStatusData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = useCallback(() => {
        setIsLoading(true);
        fetch('/api/user/status')
            .then(res => res.json())
            .then(data => setStatusData(data))
            .catch(err => console.error("Falha ao buscar status do usuário:", err))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    const noPlansActive = !statusData?.hasActiveSubscription && (!statusData?.boostedProducts || statusData.boostedProducts.length === 0);
    const hasAvailableCarousel = statusData?.availableCarouselPurchases && statusData.availableCarouselPurchases.length > 0;

    return (
        <div className="space-y-6">
            {hasAvailableCarousel && <CarouselRequestCard purchases={statusData.availableCarouselPurchases} onSubmission={fetchStatus} />}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bangers">Status dos Seus Planos Ativos</CardTitle>
                    <CardDescription>Veja aqui seus benefícios e o tempo restante de cada um.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {noPlansActive && (
                        <div className="text-center text-slate-500 py-6">
                            <p>Você não possui nenhum plano ou boost ativo no momento.</p>
                        </div>
                    )}
                    {statusData?.hasActiveSubscription && (
                        <div className="flex items-center gap-4 rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <Crown className="h-8 w-8 text-yellow-500 shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold text-yellow-800 dark:text-yellow-300">Plano "Meu Catálogo no Zaca"</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    Renova em: {statusData.subscriptionEndDate ? new Date(statusData.subscriptionEndDate).toLocaleDateString('pt-BR') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}
                    {statusData?.boostedProducts && statusData.boostedProducts.length > 0 && (
                         <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                            <div className="flex items-center gap-4 mb-3">
                                <Rocket className="h-8 w-8 text-blue-500 shrink-0" />
                                <div>
                                    <p className="font-semibold text-blue-800 dark:text-blue-300">Achadinhos Turbinados Ativos</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-500">Seus produtos com destaque na homepage.</p>
                                </div>
                            </div>
                            <ul className="space-y-2 pl-2 border-l border-blue-200 dark:border-blue-700/50 ml-6">
                                {statusData.boostedProducts.map(product => (
                                    <li key={product.id} className="text-sm">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{product.name}</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3"/> {getTimeRemaining(product.boostedUntil)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full sm:w-auto" variant="secondary">
                        <Link href="/planos">Ver todos os Planos de UP</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

const SidebarNavLinks = ({ isMobile = false, closeSheet }: { isMobile?: boolean, closeSheet?: () => void }) => {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Painel Principal", icon: LayoutDashboard },
    { href: "/dashboard/add-product", label: "Adicionar Produto", icon: PlusCircle },
    { href: "/dashboard/link-shortener", label: "Encurtador de Links", icon: LinkIcon },
    { href: "/dashboard/sales", label: "Minhas Vendas", icon: ShoppingBag },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <nav className={`flex flex-col space-y-1 ${isMobile ? 'p-4' : 'px-3 py-4'}`}>
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} legacyBehavior passHref>
          <a onClick={closeSheet} className={`w-full flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${pathname === item.href ? "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-400" : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
};


// --- Componente Principal da Página ---
export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productError, setProductError] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const userId = useMemo(() => session?.user?.id, [session]);
  
    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push('/auth/signin');
      }
      if (status === 'authenticated' && userId) {
        setIsLoadingProducts(true);
        fetch(`/api/products?userId=${userId}`)
          .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao buscar produtos.')))
          .then(data => setProducts(Array.isArray(data) ? data : []))
          .catch(err => setProductError(err.message))
          .finally(() => setIsLoadingProducts(false));
      }
    }, [status, userId, router]);
  
    const openDeleteDialog = (product: Product) => setProductToDelete(product);
    const closeDeleteDialog = () => setProductToDelete(null);
  
    const handleConfirmDelete = async () => {
      if (!productToDelete) return;
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/products/${productToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'Falha ao excluir o produto.');
        toast.success(`Produto "${productToDelete.name}" excluído!`);
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        closeDeleteDialog();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
      } finally {
        setIsDeleting(false);
      }
    };
  
    if (status === 'loading') {
      return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="w-16 h-16 animate-spin text-sky-500" /></div>;
    }
    
    if (!session || !session.user) {
      return null;
    }
  
    return (
      <>
        <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
          <aside className="hidden lg:flex lg:flex-col w-64 border-r dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center h-20 border-b dark:border-slate-800 px-6">
              <Link href="/"><Image src="/zacalogo2.svg" alt="Logo" width={150} height={40} /></Link>
            </div>
            <div className="flex-grow"><SidebarNavLinks /></div>
            <div className="p-4 border-t dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
            </div>
          </aside>
  
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="lg:hidden flex items-center justify-between h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4">
              <Link href="/"><Image src="/zacalogo2.svg" alt="Logo" width={120} height={35} /></Link>
              <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}><SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72 p-0"><SidebarNavLinks isMobile closeSheet={() => setIsMobileSidebarOpen(false)} /></SheetContent></Sheet>
            </header>
  
            <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bangers">Painel do Vendedor</CardTitle>
                    <CardDescription>Bem-vindo, {session.user.name?.split(' ')[0]}!</CardDescription>
                </CardHeader>
              </Card>
              
              <UserStatusCard />
  
              <section>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold">Seus Produtos</h2>
                      <Button asChild size="lg"><Link href="/dashboard/add-product"><PlusCircle className="mr-2" /> Adicionar Produto</Link></Button>
                  </div>
                  {isLoadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}</div>
                        ) : productError ? (
                        <Card className="text-center p-6 bg-red-50 dark:bg-red-900/20"><AlertTriangle className="mx-auto h-8 w-8 text-red-500" />{productError}</Card>
                        ) : products.length === 0 ? (
                        <Card className="text-center p-10"><ShoppingBag className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-4 text-xl">Nenhum produto cadastrado.</h3><p className="text-sm text-muted-foreground">Adicione seu primeiro produto para começar a vender!</p></Card>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                            <Card key={product.id} className="flex flex-col overflow-hidden group">
                                <CardHeader className="p-0 border-b relative">
                                <div className="aspect-square w-full">
                                    <Image src={(product.images && product.images.length > 0) ? product.images[0] : '/img-placeholder.png'} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                                </CardContent>
                                <CardFooter className="p-4 border-t bg-slate-50 dark:bg-slate-800/50">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/dashboard/edit-product/${product.id}`}><Edit3 className="mr-2 h-4 w-4" /> Editar</Link>
                                    </Button>
                                    {/* <<< CORREÇÃO APLICADA AQUI >>> */}
                                    <Button variant="destructive" size="sm" className="w-full" onClick={() => openDeleteDialog(product)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </Button>
                                </div>
                                </CardFooter>
                            </Card>
                            ))}
                        </div>
                    )}
              </section>
            </main>
          </div>
        </div>
  
        <Dialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && closeDeleteDialog()}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                      Tem certeza que deseja excluir o produto "<strong>{productToDelete?.name}</strong>"? Esta ação é irreversível e removerá o produto permanentemente.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-4">
                  <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Confirmar Exclusão
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
