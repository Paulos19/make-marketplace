// app/dashboard/page.tsx
"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Componentes Shadcn/ui
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Ícones Lucide
import {
  LayoutDashboard, PlusCircle, Settings, LogOut, Menu, UserCircle2,
  ShoppingBag, Edit3, AlertTriangle, Info, X, ListOrdered,
  Loader2
} from 'lucide-react';

// Interfaces (mantidas como antes)
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[];
  createdAt: string;
}

// Componente de navegação da Sidebar para reutilização
const SidebarNavLinks = ({ isMobile = false, closeSheet }: { isMobile?: boolean, closeSheet?: () => void }) => {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Painel Principal", icon: LayoutDashboard },
    { href: "/dashboard/add-product", label: "Adicionar Produto", icon: PlusCircle },
    { href: "/dashboard/sales", label: "Minhas Vendas", icon: ShoppingBag }, // Rota para o vendedor ver os pedidos
    { href: "/dashboard/settings", label: "Configurações da Loja", icon: Settings },
  ];

  const linkClasses = (href: string) =>
    `w-full flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${pathname === href
      ? "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-400"
      : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-500"
    }`;

  const Comp = isMobile ? SheetClose : 'a';

  return (
    <nav className={`flex flex-col space-y-1 ${isMobile ? 'p-4' : 'px-3 py-4'}`}>
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} legacyBehavior passHref>
          <Comp onClick={closeSheet} className={linkClasses(item.href)}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Comp>
        </Link>
      ))}
    </nav>
  );
};


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userId = useMemo(() => session?.user?.id, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userId) {
      setIsLoadingProducts(true);
      setProductError(null);
      fetch(`/api/products?userId=${userId}`)
        .then(res => {
          if (!res.ok) throw new Error('Falha ao buscar seus produtos.');
          return res.json();
        })
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(err => setProductError(err.message))
        .finally(() => setIsLoadingProducts(false));
    }
  }, [status, userId, router]);

  const getAvatarFallback = () => {
    const nameToUse = session?.user?.name;
    if (nameToUse) {
      const initials = nameToUse.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center text-gray-700 dark:text-gray-300">
          <Loader2 className="w-16 h-16 animate-spin text-sky-500 mb-4" />
          <p className="text-xl">Carregando Painel...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Sidebar Desktop (Fixa em telas grandes) */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-800 px-6">
          <Link href="/" aria-label="Zacaplace Home">
            <Image src="/loginLogo.png" alt="Zacaplace Logo" width={150} height={40} priority />
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto">
          <SidebarNavLinks />
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'Avatar'} />
              <AvatarFallback className="bg-zaca-roxo text-white">{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold truncate">{session.user?.name || 'Usuário'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full dark:border-slate-700 dark:hover:bg-slate-800">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile com Sidebar Retrátil */}
        <header className="lg:hidden flex items-center justify-between h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 sticky top-0 z-40">
          <Link href="/" aria-label="Zacaplace Home">
            <Image src="/loginLogo.png" alt="Zacaplace Logo" width={120} height={35} />
          </Link>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white dark:bg-slate-900 p-0 flex flex-col">
              <SheetHeader className="flex items-center justify-between h-20 border-b dark:border-slate-800 px-6">
                <SheetTitle>
                   <Link href="/" aria-label="Zacaplace Home">
                      <Image src="/loginLogo.png" alt="Zacaplace Logo" width={140} height={38} />
                   </Link>
                </SheetTitle>
                <SheetClose>
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="sr-only">Fechar</span>
                </SheetClose>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto">
                <SidebarNavLinks isMobile={true} closeSheet={() => setIsMobileSidebarOpen(false)} />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
                 <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full dark:border-gray-700 dark:hover:bg-gray-800">
                   <LogOut className="mr-2 h-4 w-4" /> Sair
                 </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Área de Conteúdo da Página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-8">
          <Card className="dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl font-bangers tracking-wide text-zaca-roxo dark:text-zaca-lilas">
                Painel do Zaca
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Bem-vindo(a) de volta, {session.user?.name?.split(' ')[0] || 'Cumpadi'}! Gerencie seus produtos e vendas aqui.
              </CardDescription>
            </CardHeader>
          </Card>

          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Seus Produtos Cadastrados</h2>
              <Button asChild size="lg" className="bg-zaca-azul hover:bg-zaca-azul/90 text-white shadow hover:shadow-md transition-all w-full sm:w-auto">
                <Link href="/dashboard/add-product">
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo Produto
                </Link>
              </Button>
            </div>
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                      <Card key={i} className="dark:bg-gray-800/50"><CardHeader><Skeleton className="h-48 w-full rounded-t-md" /></CardHeader><CardContent className="space-y-2 p-4"><Skeleton className="h-5 w-3/4 rounded" /><Skeleton className="h-4 w-1/2 rounded" /><Skeleton className="h-8 w-1/3 rounded mt-2" /></CardContent><CardFooter className="p-4 border-t dark:border-gray-700"><Skeleton className="h-9 w-full rounded-md" /></CardFooter></Card>
                  ))}
              </div>
            ) : productError ? (
              <Card className="text-center p-6 bg-red-50 dark:bg-red-900/20"><AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />{productError}</Card>
            ) : products.length === 0 ? (
              <Card className="text-center p-10"><ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h3 className="text-xl font-semibold">Nenhum produto cadastrado.</h3><p className="text-gray-500">Clique no botão acima para adicionar seu primeiro achadinho!</p></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-800/80 border dark:border-slate-700/50">
                    <CardHeader className="p-0 border-b dark:border-slate-700/50"><div className="relative w-full aspect-[4/3]"><Image src={product.imageUrls[0] || '/img-placeholder.png'} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw"/></div></CardHeader>
                    <CardContent className="p-4 flex-grow space-y-2"><CardTitle className="text-lg font-semibold truncate"><Link href={`/products/${product.id}`} target="_blank">{product.name}</Link></CardTitle><CardDescription className="text-xs text-gray-500 dark:text-gray-400">Adicionado em: {new Date(product.createdAt).toLocaleDateString()}</CardDescription><p className="text-xl font-bold text-sky-700 dark:text-sky-500">R$ {product.price.toFixed(2)}</p></CardContent>
                    <CardFooter className="p-4 border-t dark:border-slate-700/50"><Button asChild variant="outline" size="sm" className="w-full"><Link href={`/dashboard/edit-product/${product.id}`}><Edit3 className="mr-2 h-4 w-4" /> Editar</Link></Button></CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}