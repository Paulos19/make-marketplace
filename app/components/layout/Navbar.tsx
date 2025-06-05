"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  ShoppingBag, LogIn, LogOut, PlusCircle, 
  LayoutDashboard, Settings, UserCircle2, Menu, X, ShieldCheck, ListOrdered
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isSellerOrAdmin = userRole === 'ADMIN' || userRole === 'SELLER';
  const isCommonUser = userRole === 'USER';

  let fallbackContent: React.ReactNode = <UserCircle2 className="h-6 w-6" />;
  if (session?.user?.name) {
    const initials = session.user.name.trim().split(' ').map(n => n[0]).join('').toUpperCase();
    if (initials) {
      fallbackContent = initials.substring(0, 2);
    }
  }

  const commonButtonLinkClasses = (href: string, isMobile = false) => 
    cn(
      `flex items-center text-sm font-medium transition-colors duration-200 ease-in-out`,
      isMobile ? "w-full justify-start px-4 py-3" : "px-3 py-2 rounded-md",
      pathname === href 
        ? 'bg-zaca-lilas/20 text-zaca-roxo dark:bg-zaca-lilas/10 dark:text-zaca-lilas' 
        : 'text-slate-700 dark:text-slate-300 hover:bg-zaca-lilas/10 hover:text-zaca-roxo dark:hover:bg-zaca-lilas/5 dark:hover:text-zaca-lilas'
    );
  
  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled 
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-slate-200 dark:border-slate-800" 
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="Zacaplace Home">
            <Image src="/logo.svg" alt="Zacaplace Logo" width={160} height={45} priority />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Button asChild variant="ghost" size="sm" className={commonButtonLinkClasses("/products")}>
              <Link href="/products"><ShoppingBag className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Achadinhos</span></Link>
            </Button>
            {isSellerOrAdmin && (
              <Button asChild variant="ghost" size="sm" className={commonButtonLinkClasses("/dashboard/add-product")}>
                <Link href="/dashboard/add-product"><PlusCircle className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Vender Agora!</span></Link>
              </Button>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <><Skeleton className="h-9 w-24 rounded-md" /><Skeleton className="h-9 w-9 rounded-full" /></>
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-zaca-magenta transition-all">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User avatar'} />
                      <AvatarFallback className="bg-zaca-roxo text-white text-sm font-semibold">{fallbackContent}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 mt-2 shadow-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3 px-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-50">{session.user.name || 'Usuário'}</p>
                      <p className="text-xs leading-none text-slate-500 dark:text-slate-400">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  
                  {isSellerOrAdmin && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                        <Link href="/dashboard" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                          <LayoutDashboard className="mr-2 h-4 w-4" /><span>Painel do Zaca</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                        <Link href="/dashboard/settings" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                          <Settings className="mr-2 h-4 w-4" /><span>Ajustes da Loja</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {isCommonUser && (
                     <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                        <Link href="/account/settings" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                          <Settings className="mr-2 h-4 w-4" /><span>Configurações</span>
                        </Link>
                      </DropdownMenuItem>
                  )}

                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                      <Link href="/admin-dashboard" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                        <ShieldCheck className="mr-2 h-4 w-4" /><span>Painel Super Zaca</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                        <Link href="/dashboard/reservations" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                          <ListOrdered className="mr-2 h-4 w-4" /><span>Minhas Reservas</span>
                        </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-zaca-vermelho focus:text-zaca-vermelho focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-400 group">
                    <LogOut className="mr-2 h-4 w-4" /><span>Sair da Turma</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-zaca-roxo to-zaca-magenta hover:from-zaca-roxo/90 hover:to-zaca-magenta/90 text-white font-semibold shadow-md">
                <Link href="/auth/signin"><LogIn className="h-4 w-4 mr-2" />Entrar na Bagunça</Link>
              </Button>
            )}
          </div>
          {/* Menu Mobile */}
          <div className="md:hidden flex items-center">{/* ... (O código do Sheet irá aqui) ... */}</div>
        </div>
      </div>
    </nav>
  );
}