"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'; // Importar useEffect e useState
import Image from 'next/image'; // Importar Image
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
  Home, ShoppingBag, User, LogIn, LogOut, PlusCircle,
  LayoutDashboard, Settings, UserCircle2, Menu, X, ShieldCheck
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils'; // Importar cn para classes condicionais

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Novo estado para controlar o scroll

  // Efeito para detectar o scroll da página
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); // Define como "scrollado" após 20px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  const isAdmin = session?.user?.role === 'ADMIN';

  let fallbackContent: React.ReactNode = <UserCircle2 className="h-6 w-6" />;
  if (session?.user?.name) {
    const initials = session.user.name
      .trim()
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
    if (initials) {
      fallbackContent = initials.substring(0, 2);
    }
  }

  const navLinks = [
    { href: "/products", label: "Produtos", icon: ShoppingBag },
  ];

  if (status === 'authenticated') {
    navLinks.push({ href: "/dashboard/add-product", label: "Adicionar Produto", icon: PlusCircle });
  }

  const commonButtonLinkClasses = (href: string, variant: "ghost" | "outline" | "default" = "ghost", isMobile = false) => {
    let baseStyle = `flex items-center text-sm font-medium transition-colors duration-200 ease-in-out ${isMobile ? "w-full justify-start px-4 py-3" : "px-3 py-2 rounded-md"}`;
    const isActive = pathname === href;

    if (isActive) {
        baseStyle += ' bg-zaca-lilas/20 text-zaca-roxo dark:bg-zaca-lilas/10 dark:text-zaca-lilas';
    } else {
        baseStyle += ' text-slate-700 dark:text-slate-300 hover:bg-zaca-lilas/10 hover:text-zaca-roxo dark:hover:bg-zaca-lilas/5 dark:hover:text-zaca-lilas';
    }
    return baseStyle;
  };

  const renderNavLinks = (isMobile = false) => (
    navLinks.map(link => (
      <Button 
        key={link.href} 
        asChild 
        variant="ghost" // Mantém ghost para não ter bordas/fundo por padrão
        size="sm" 
        className={commonButtonLinkClasses(link.href, "ghost", isMobile)}
      >
        <Link href={link.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
          <link.icon className={`h-4 w-4 ${isMobile ? 'mr-3' : 'sm:mr-2'}`} />
          <span className={isMobile ? "" : "hidden sm:inline"}>{link.label}</span>
        </Link>
      </Button>
    ))
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
            <Image
              src="/logo.svg" // Seu logo SVG
              alt="Zacaplace Logo"
              width={160} // Ajuste conforme necessário
              height={45}  // Ajuste conforme necessário
              priority
            />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {renderNavLinks()}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
              </>
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-zaca-magenta transition-all">
                      {session.user.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || 'User avatar'} />
                      ) : null}
                      <AvatarFallback className="bg-zaca-roxo text-white text-sm font-semibold">
                        {fallbackContent}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 mt-2 shadow-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3 px-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-50">
                        {session.user.name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                    <Link href="/dashboard" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                      <Link href="/admin-dashboard" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer group focus:bg-zaca-lilas/10 dark:focus:bg-zaca-lilas/5">
                    <Link href="/dashboard/settings" className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-zaca-vermelho focus:text-zaca-vermelho focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-400 group">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-zaca-roxo to-zaca-magenta hover:from-zaca-roxo/90 hover:to-zaca-magenta/90 text-white font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[320px] bg-white dark:bg-slate-900 p-0 border-l dark:border-slate-800">
                <SheetHeader className="flex flex-row items-center justify-between h-16 border-b dark:border-slate-800 px-4 sm:px-6">
                   <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                     <Image
                        src="/logo.svg"
                        alt="Zacaplace Logo"
                        width={130}
                        height={35}
                      />
                   </Link>
                  <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                    <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <span className="sr-only">Fechar</span>
                  </SheetClose>
                </SheetHeader>
                <div className="p-4 space-y-2">
                  {renderNavLinks(true)}
                  <hr className="my-4 dark:border-slate-700"/>
                  {isLoading ? (
                    <div className="space-y-3 px-4">
                      <Skeleton className="h-9 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-9 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ) : session?.user ? (
                    <>
                      <Button asChild variant="ghost" size="sm" className={commonButtonLinkClasses("/dashboard", "ghost", true)}>
                         <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button asChild variant="ghost" size="sm" className={commonButtonLinkClasses("/admin-dashboard", "ghost", true)}>
                          <Link href="/admin-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShieldCheck className="mr-3 h-4 w-4" /> Painel Admin
                          </Link>
                        </Button>
                      )}
                       <Button asChild variant="ghost" size="sm" className={commonButtonLinkClasses("/dashboard/settings", "ghost", true)}>
                         <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                          <Settings className="mr-3 h-4 w-4" /> Configurações
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }} className="w-full justify-start px-4 py-3 text-sm font-medium text-zaca-vermelho hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-700/10">
                        <LogOut className="mr-3 h-4 w-4" /> Sair
                      </Button>
                    </>
                  ) : (
                     <Button asChild size="default" className="w-full bg-gradient-to-r from-zaca-roxo to-zaca-magenta hover:from-zaca-roxo/90 hover:to-zaca-magenta/90 text-white py-3">
                      <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                        <LogIn className="mr-2 h-5 w-5" /> Login / Cadastrar
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}