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
import { Badge } from "@/components/ui/badge"; // Para status

// Ícones Lucide
import {
  LayoutDashboard, PlusCircle, Settings, LogOut, Menu, UserCircle2,
  ShoppingBag, Edit3, AlertTriangle, Info, X, ChevronRight,
  ListOrdered // Adicionar ícone para a nova página de Reservas
} from 'lucide-react';

// Definição do tipo Product
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[];
  createdAt: string; // Ou Date
  // Adicione mais campos se necessário (ex: status, estoque)
}

// Componente para os links da Sidebar (para evitar repetição)
const SidebarNavLinks = ({ isMobile = false, closeSheet }: { isMobile?: boolean, closeSheet?: () => void }) => {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/dashboard/add-product", label: "Adicionar Produto", icon: PlusCircle },
    { href: "/dashboard/reservations", label: "Minhas Reservas", icon: ListOrdered }, // Novo link adicionado
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
  ];

  const linkClasses = (href: string) =>
    `w-full flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${pathname === href
      ? "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-400"
      : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-500"
    }`;

  return (
    <nav className={`flex flex-col space-y-1 ${isMobile ? 'p-4' : 'px-3 py-4'}`}>
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} legacyBehavior passHref>
          <a onClick={closeSheet} className={linkClasses(item.href)}>
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
  // Removido estado de reservas daqui, pois será gerenciado na nova página
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userId = useMemo(() => session?.user?.id, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userId) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setProductError(null);
        try {
          const response = await fetch(`/api/products?userId=${userId}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao buscar produtos' }));
            throw new Error(errorData.message || 'Falha ao buscar produtos');
          }
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
          setProductError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
          console.error("Erro ao buscar produtos:", err);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
      // Removido fetchReservations daqui
    } else if (status === 'authenticated' && !userId) {
      setIsLoadingProducts(false);
      setProductError("ID do usuário não encontrado na sessão.");
    }
  }, [status, userId, router]);

  // Fallback de iniciais para o Avatar
  const getAvatarFallback = () => {
    const nameToUse = session?.user?.name;
    if (nameToUse) {
      const initials = nameToUse.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };

  if (status === 'loading') {
    return ( // Skeleton para a página inteira enquanto a sessão carrega
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center text-gray-700 dark:text-gray-300">
          <LayoutDashboard className="w-16 h-16 animate-pulse text-sky-500 mb-4" />
          <p className="text-xl">Carregando Painel...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // O useEffect já deve ter redirecionado, mas como fallback
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70">
        <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-800 px-6">
          <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">
            MakeStore
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto">
          <SidebarNavLinks />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'Avatar'} />
              <AvatarFallback className="bg-sky-500 text-white">{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold truncate">{session.user?.name || 'Usuário'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full dark:border-gray-700 dark:hover:bg-gray-800">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="lg:hidden flex items-center justify-between h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 sticky top-0 z-40">
          <Link href="/" className="text-xl font-bold text-indigo-600">MakeStore</Link>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white dark:bg-gray-900 p-0">
              <SheetHeader className="flex items-center justify-between h-20 border-b dark:border-gray-800 px-6">
                <SheetTitle className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">MakeStore</SheetTitle>
                <SheetClose>
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="sr-only">Fechar</span>
                </SheetClose>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto">
                <SidebarNavLinks isMobile={true} closeSheet={() => setIsMobileSidebarOpen(false)} />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'Avatar'} />
                    <AvatarFallback className="bg-sky-500 text-white">{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold truncate">{session.user?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="w-full dark:border-gray-700 dark:hover:bg-gray-800">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Área de Conteúdo da Página Dashboard Home */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Seção de Boas-vindas e Informações */}
          <Card className="dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Bem-vindo(a) ao seu Painel, {session.user?.name?.split(' ')[0] || 'Usuário'}!</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Gerencie seus produtos e configurações da sua loja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* @ts-ignore */}
              {session.user?.whatsappLink ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400">
                  <Info className="mr-1.5 h-4 w-4" /> WhatsApp configurado: {session.user.whatsappLink}
                </Badge>
              ) : (
                <>
                  <AlertTriangle className="inline-block mr-1.5 h-5 w-5 text-yellow-500" /><span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Seu link do WhatsApp não foi adicionado. Isso pode impactar suas vendas!{' '}
                    <Link href="/dashboard/settings" className="font-semibold underline hover:text-yellow-700 dark:hover:text-yellow-300">
                      Adicionar agora
                    </Link>
                  </span>
                </>
              )}
            </CardContent>
          </Card>

          {/* Seção Seus Produtos */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Seus Produtos</h2>
              <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-700 text-white shadow hover:shadow-md transition-all w-full sm:w-auto">
                <Link href="/dashboard/add-product">
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo Produto
                </Link>
              </Button>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => ( // Exibe 4 skeletons
                  <Card key={i} className="dark:bg-gray-800/50">
                    <CardHeader><Skeleton className="h-48 w-full rounded-t-md" /></CardHeader>
                    <CardContent className="space-y-2 p-4">
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                      <Skeleton className="h-8 w-1/3 rounded mt-2" />
                    </CardContent>
                    <CardFooter className="p-4 border-t dark:border-gray-700">
                      <Skeleton className="h-9 w-full rounded-md" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : productError ? (
              <Card className="dark:bg-gray-800/50">
                <CardContent className="p-6 text-center text-red-500 dark:text-red-400">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-3" />
                  <p className="font-semibold">Erro ao carregar seus produtos.</p>
                  <p className="text-sm">{productError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">Tentar Novamente</Button>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card className="dark:bg-gray-800/50">
                <CardContent className="p-10 text-center text-gray-500 dark:text-gray-400">
                  <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado ainda.</h3>
                  <p className="mb-4">Comece adicionando seu primeiro produto para exibi-lo aqui.</p>
                  <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
                    <Link href="/dashboard/add-product">
                      <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Primeiro Produto
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800/80 border dark:border-gray-700/50">
                    <CardHeader className="p-0 border-b dark:border-gray-700/50">
                      <div className="relative w-full aspect-[4/3]"> {/* Aspect ratio para a imagem */}
                        <Image
                          src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow space-y-2">
                      <CardTitle className="text-lg font-semibold truncate hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        <Link href={`/products/${product.id}`} target="_blank" title="Ver produto na loja">{product.name}</Link>
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                        Adicionado em: {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                      </CardDescription>
                      <p className="text-xl font-bold text-sky-700 dark:text-sky-500">R$ {product.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="p-4 border-t dark:border-gray-700/50">
                      <Button asChild variant="outline" size="sm" className="w-full dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-700/20">
                        <Link href={`/dashboard/edit-product/${product.id}`}>
                          <Edit3 className="mr-2 h-4 w-4" /> Editar Produto
                        </Link>
                      </Button>
                    </CardFooter>
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