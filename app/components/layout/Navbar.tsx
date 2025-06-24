"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  Heart,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Home,
  Package2,
  Store,
  ShoppingBag,
  LucidePlusCircle,
  Crown,
  BadgeCent,
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import { GlobalSearchCommand } from '../search/GlobalSearchCommand';

// HOOK PARA BUSCAR STATUS DO USUÁRIO
function useUserStatus() {
    const { data: session, status } = useSession();
    const [userStatus, setUserStatus] = useState({
        hasActiveSubscription: false,
        hasActiveTurboBoost: false,
        hasActiveCarousel: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/user/status')
                .then(res => res.json())
                .then(data => {
                    setUserStatus(data);
                })
                .catch(err => console.error("Falha ao buscar status do usuário:", err))
                .finally(() => setIsLoading(false));
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status]);

    return { ...userStatus, isLoading };
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const { hasActiveSubscription, hasActiveTurboBoost, hasActiveCarousel } = useUserStatus();

  useEffect(() => {
    if (status === 'authenticated' && user?.role === UserRole.SELLER) {
      const fetchPendingCount = async () => {
        try {
          const response = await fetch('/api/sales/pending-count');
          if (response.ok) {
            const data = await response.json();
            setPendingSalesCount(data.count || 0);
          }
        } catch (error) {
          console.error("Falha ao buscar contagem de vendas pendentes:", error);
        }
      };
      fetchPendingCount();
    } else {
      setPendingSalesCount(0);
    }
  }, [status, user]);

  const mainNavLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/products', label: 'Achadinhos', icon: Package2 },
    { href: '/sellers', label: 'Vendedores', icon: Store },
    { href: '/planos', label: 'Planos', icon: BadgeCent },
  ];

  const userNavLinks = [
    { href: '/my-reservations', label: 'Minhas Compras', icon: Heart },
    { href: '/dashboard', label: 'Minha Loja', icon: LayoutDashboard },
  ];

  const getAvatarFallback = (name?: string | null) => {
    if (!name) return <UserCircle2 />;
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const avatarRingClass = cn({
      "ring-2 ring-offset-2 dark:ring-offset-slate-900": hasActiveSubscription || hasActiveTurboBoost || hasActiveCarousel,
      "ring-yellow-400": hasActiveSubscription,
      "ring-blue-500": !hasActiveSubscription && hasActiveTurboBoost,
      "ring-red-500": !hasActiveSubscription && !hasActiveTurboBoost && hasActiveCarousel
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/zacalogo2.svg" alt="Zacaplace Logo" width={200} height={60} priority />
          </Link>
          <nav className="hidden lg:flex">
            <ul className="flex items-center space-x-6 text-sm font-medium">
              {mainNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "transition-colors hover:text-zaca-azul dark:hover:text-zaca-lilas",
                      pathname === link.href ? "text-zaca-roxo dark:text-zaca-lilas font-semibold" : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end gap-x-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <GlobalSearchCommand />
          </div>

          <Link href='/my-reservations'>
            <Button variant="ghost" size="icon" aria-label="Minhas Compras" className="hidden sm:inline-flex">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          {user?.role === UserRole.SELLER && (
            <Link href='/dashboard/sales' className="relative">
              <Button variant="ghost" size="icon" aria-label="Minhas Vendas" className="hidden sm:inline-flex">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              {pendingSalesCount > 0 && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
                  {pendingSalesCount}
                </div>
              )}
            </Link>
          )}
          
          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          <div className="hidden lg:flex items-center">
            {status === 'loading' ? (
              <div className="h-10 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0">
                    <Avatar className={cn("h-10 w-10", avatarRingClass)}>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                      <AvatarFallback className="bg-zaca-roxo text-white font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                    </Avatar>
                    {hasActiveSubscription && (
                        <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-lg" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNavLinks.map(link => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href}><link.icon className="mr-2 h-4 w-4" /> {link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  {user.role === UserRole.ADMIN && (
                     <DropdownMenuItem asChild>
                       <Link href="/admin-dashboard"><UserCircle2 className="mr-2 h-4 w-4" /> Painel Admin</Link>
                     </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/auth/signin">Entrar</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm p-0 flex flex-col">
                {/* --- INÍCIO DA ATUALIZAÇÃO DO MENU MOBILE --- */}
                {user ? (
                  <div className="p-4 border-b dark:border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
                       <div className="relative">
                          <Avatar className={cn("h-12 w-12", avatarRingClass)}>
                              <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                              <AvatarFallback className="bg-zaca-roxo text-white font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                          </Avatar>
                          {hasActiveSubscription && (
                              <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-lg" />
                          )}
                       </div>
                       <div className="flex-1 truncate">
                          <p className="text-sm font-semibold leading-none truncate">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                       </div>
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 border-b dark:border-slate-800">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <Image src="/zacalogo2.svg" alt="Zacaplace Logo" width={150} height={40} />
                    </Link>
                  </div>
                )}
                {/* --- FIM DA ATUALIZAÇÃO --- */}
                
                <nav className="flex flex-col space-y-1 p-4 flex-1">
                  {mainNavLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                       <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 text-lg font-medium transition-colors hover:text-zaca-azul dark:hover:text-zaca-lilas p-2 rounded-md",
                          pathname === link.href ? "text-zaca-roxo bg-slate-100 dark:text-zaca-lilas dark:bg-slate-800" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator className="my-4" />
                  {user ? (
                    <>
                      <SheetClose asChild><Link href="/my-reservations" className="flex items-center gap-3 text-lg font-medium p-2 rounded-md text-slate-700 dark:text-slate-200 hover:text-zaca-azul dark:hover:text-zaca-lilas"><Heart className="mr- h-5 w-5"/>Minhas Compras</Link></SheetClose>
                      <SheetClose asChild><Link href="/dashboard" className="flex items-center gap-3 text-lg font-medium p-2 rounded-md text-slate-700 dark:text-slate-200 hover:text-zaca-azul dark:hover:text-zaca-lilas"><LayoutDashboard className="mr- h-5 w-5"/>Minha Loja</Link></SheetClose>

                      {user.role === UserRole.SELLER && (
                          <SheetClose asChild>
                              <Link href="/dashboard/sales" className="flex items-center justify-between text-lg font-medium p-2 rounded-md text-slate-700 dark:text-slate-200 hover:text-zaca-azul dark:hover:text-zaca-lilas">
                                  <div className="flex items-center gap-3">
                                      <ShoppingBag className="mr- h-5 w-5" />
                                      Minhas Vendas
                                  </div>
                                  {pendingSalesCount > 0 && (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                          {pendingSalesCount}
                                      </div>
                                  )}
                              </Link>
                          </SheetClose>
                      )}

                      {user.role === UserRole.ADMIN && (
                        <SheetClose asChild>
                          <Link href="/admin-dashboard" className="flex items-center gap-3 text-lg font-medium p-2 rounded-md text-slate-700 dark:text-slate-200 hover:text-zaca-azul dark:hover:text-zaca-lilas">
                            <UserCircle2 className="mr- h-5 w-5"/>Painel Admin
                          </Link>
                        </SheetClose>
                      )}
                    </>
                  ) : (
                    <>
                      <SheetClose asChild><Link href="/auth/signin" className="flex items-center gap-3 text-lg font-medium p-2 rounded-md"><LogIn className="mr- h-5 w-5"/>Entrar</Link></SheetClose>
                      <SheetClose asChild><Link href="/auth/signup"><Button className="w-full bg-zaca-azul hover:bg-zaca-azul/90"><UserPlus className="mr-2 h-5 w-5"/>Criar Conta</Button></Link></SheetClose>
                    </>
                  )}
                </nav>
                {user && (
                    <div className="p-4 mt-auto border-t dark:border-slate-800">
                        <Button variant="outline" onClick={() => {signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false);}} className="w-full"><LogOut className="mr-2 h-5 w-5"/>Sair</Button>
                    </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
