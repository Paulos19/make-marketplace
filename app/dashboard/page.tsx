"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, PlusCircle, Settings, LogOut, Menu, UserCircle2, ShoppingBag, Edit3, AlertTriangle, Loader2, LinkIcon } from 'lucide-react';

// CORREÇÃO: A interface agora usa 'images' para corresponder ao banco de dados.
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images: string[];
  createdAt: string;
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const userId = useMemo(() => session?.user?.id, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status === 'authenticated' && userId) {
      setIsLoadingProducts(true);
      fetch(`/api/products?userId=${userId}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao buscar produtos.')))
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(err => setProductError(err.message))
        .finally(() => setIsLoadingProducts(false));
    }
  }, [status, userId, router]);

  const getAvatarFallback = () => session?.user?.name?.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || <UserCircle2 />;

  if (status === 'loading') {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="w-16 h-16 animate-spin text-sky-500" /></div>;
  }
  
  // CORREÇÃO: Verificação robusta que resolve o erro de tipo 'session.user' is possibly 'undefined'.
  if (!session || !session.user) {
    // Pode retornar um skeleton ou redirecionar, mas para o erro de tipo, isto é suficiente.
    return <div className="flex h-screen w-screen items-center justify-center">A carregar dados do usuário...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
      <aside className="hidden lg:flex lg:flex-col w-64 border-r dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-center h-20 border-b dark:border-slate-800 px-6">
          <Link href="/"><Image src="/zacalogo.svg" alt="Logo" width={150} height={40} /></Link>
        </div>
        <div className="flex-grow"><SidebarNavLinks /></div>
        <div className="p-4 border-t dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4">
          <Link href="/"><Image src="/zacalogo.svg" alt="Logo" width={120} height={35} /></Link>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}><SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72 p-0"><SidebarNavLinks isMobile closeSheet={() => setIsMobileSidebarOpen(false)} /></SheetContent></Sheet>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-8">
          <Card><CardHeader><CardTitle className="text-3xl font-bangers">Painel do Vendedor</CardTitle><CardDescription>Bem-vindo, {session.user.name?.split(' ')[0]}!</CardDescription></CardHeader></Card>
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Seus Produtos</h2>
              <Button asChild size="lg"><Link href="/dashboard/add-product"><PlusCircle className="mr-2" /> Adicionar Produto</Link></Button>
            </div>
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}</div>
            ) : productError ? (
              <Card className="text-center p-6 bg-red-50"><AlertTriangle className="mx-auto h-8 w-8 text-red-500" />{productError}</Card>
            ) : products.length === 0 ? (
              <Card className="text-center p-10"><ShoppingBag className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-4 text-xl">Nenhum produto.</h3></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="flex flex-col">
                    <CardHeader className="p-0 border-b">
                      <div className="relative w-full aspect-square">
                        {/* CORREÇÃO: Usa 'images' e tem uma verificação de segurança. */}
                        <Image src={(product.images && product.images.length > 0) ? product.images[0] : '/img-placeholder.png'} alt={product.name} fill className="object-cover" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow"><CardTitle className="text-lg truncate">{product.name}</CardTitle></CardContent>
                    <CardFooter className="p-4 border-t"><Button asChild variant="outline" size="sm" className="w-full"><Link href={`/dashboard/edit-product/${product.id}`}><Edit3 className="mr-2 h-4" /> Editar</Link></Button></CardFooter>
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
