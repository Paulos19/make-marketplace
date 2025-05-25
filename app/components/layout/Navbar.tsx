"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation'; 
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
  LayoutDashboard, Settings, UserCircle2, Menu, X, ShieldCheck // Added ShieldCheck for Admin Panel
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; 
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Correção: Verificar a role do usuário da sessão
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


  const commonLinkClasses = (href: string) => 
    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href 
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
    }`;
  
  const commonButtonLinkClasses = (href: string, variant: "ghost" | "outline" | "default" = "ghost") => {
    let baseStyle = "flex items-center text-sm font-medium transition-colors ";
    if (variant === "ghost") {
      baseStyle += (pathname === href 
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400');
    } else if (variant === "outline") {
      baseStyle += (pathname === href
        ? 'bg-indigo-100 text-indigo-700 border-indigo-500 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700'
        : 'text-indigo-600 border-indigo-500 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-900/50');
    }
    return baseStyle;
  };


  const renderNavLinks = (isMobile = false) => (
    navLinks.map(link => (
      <Button key={link.href} asChild variant="ghost" size="sm" className={commonButtonLinkClasses(link.href) + (isMobile ? " w-full justify-start" : "")}>
        <Link href={link.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
          <link.icon className={`h-4 w-4 ${isMobile ? 'mr-3' : 'sm:mr-2'}`} />
          <span className={isMobile ? "" : "hidden sm:inline"}>{link.label}</span>
        </Link>
      </Button>
    ))
  );

  return (
    <nav className="bg-white dark:bg-gray-900/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {}
          <Link href="/" className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity">
            MakeStore
          </Link>

          {}
          <div className="hidden md:flex items-center space-x-1">
            {renderNavLinks()}
          </div>

          {}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </>
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-indigo-500 transition-all">
                      {session.user.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || 'User avatar'} />
                      ) : null}
                      <AvatarFallback className="bg-indigo-500 text-white text-sm font-semibold">
                        {fallbackContent}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 mt-2 shadow-xl dark:bg-gray-800" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3 px-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-50">
                        {session.user.name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  {}
                  <DropdownMenuItem asChild className="cursor-pointer group dark:focus:bg-gray-700">
                    <Link href="/dashboard" className="flex items-center text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer group dark:focus:bg-gray-700">
                      <Link href="/admin-dashboard" className="flex items-center text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        <ShieldCheck className="mr-2 h-4 w-4" /> 
                        <span>Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer group dark:focus:bg-gray-700">
                    <Link href="/dashboard/settings" className="flex items-center text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-400 group">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                <Link href="/auth/signin">
                  <span className="flex items-center"> {}
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </span>
                </Link>
              </Button>
            )}
          </div>

          {}
          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[320px] bg-white dark:bg-gray-900 p-0">
                <SheetHeader className="p-6 border-b dark:border-gray-800">
                  <SheetTitle className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">MakeStore</SheetTitle>
                   <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fechar</span>
                  </SheetClose>
                </SheetHeader>
                <div className="p-4 space-y-2">
                  {renderNavLinks(true)}
                  <hr className="my-4 dark:border-gray-700"/>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-full rounded-md" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  ) : session?.user ? (
                    <>
                      <Button asChild variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                         <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button asChild variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Link href="/admin-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShieldCheck className="mr-3 h-4 w-4" /> Painel Admin
                          </Link>
                        </Button>
                      )}
                       <Button asChild variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                         <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                          <Settings className="mr-3 h-4 w-4" /> Configurações
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-700/20">
                        <LogOut className="mr-3 h-4 w-4" /> Sair
                      </Button>
                    </>
                  ) : (
                     <Button asChild size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <LogIn className="mr-3 h-4 w-4" /> Login / Cadastrar
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