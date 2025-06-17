"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  ShoppingCart,
  Heart,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  LogIn,
  Home,
  Package2,
  UserPlus
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { Separator } from '@/components/ui/separator';

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/products', label: 'Achadinhos' },
    { href: '/sellers', label: 'Vendedores' },
    { href: '/dashboard/add-product', label: 'Adicionar Produtos' },
    // Adicione mais links aqui se necessário
  ];

  const getAvatarFallback = (name?: string | null) => {
    if (!name) return <UserCircle2 />;
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/zacalogo2.svg" alt="Zacaplace Logo" width={200} height={60} priority />
          </Link>
        </div>
        
        {/* Navegação Desktop (visível em telas grandes) */}
        <nav className="hidden lg:flex flex-1 items-center justify-center">
          <ul className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
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

        {/* Ícones e Login/Usuário */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-4">
          <Link href='/my-reservations'>
          <Button variant="ghost" size="icon" aria-label="Favoritos">
            <Heart className="h-5 w-5" />
          </Button>
          </Link>

          <Link href='/sellers'>
          <Button variant="ghost" size="icon" aria-label="Carrinho">
            <ShoppingCart className="h-5 w-5" />
          </Button>
          </Link>
          
          <div className="hidden lg:flex items-center">
            {status === 'loading' ? (
              <div className="h-10 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                      <AvatarFallback className="bg-zaca-roxo text-white font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                    </Avatar>
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
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Painel</Link>
                  </DropdownMenuItem>
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

          {/* <<< CORREÇÃO PRINCIPAL AQUI >>> */}
          {/* Botão de Menu Mobile (visível em telas pequenas) */}
          <div className="flex items-center lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                       <Link
                        href={link.href}
                        className={cn(
                          "text-lg font-medium transition-colors hover:text-zaca-azul dark:hover:text-zaca-lilas p-2 rounded-md",
                          pathname === link.href ? "text-zaca-roxo bg-slate-100 dark:text-zaca-lilas dark:bg-slate-800" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator />
                  {user ? (
                    <>
                      <SheetClose asChild><Link href="/dashboard" className="flex items-center text-lg font-medium"><LayoutDashboard className="mr-2 h-5 w-5"/>Painel</Link></SheetClose>
                      {user.role === UserRole.ADMIN && <SheetClose asChild><Link href="/admin-dashboard" className="flex items-center text-lg font-medium"><UserCircle2 className="mr-2 h-5 w-5"/>Painel Admin</Link></SheetClose>}
                      <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}><LogOut className="mr-2 h-5 w-5"/>Sair</Button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild><Link href="/auth/signin" className="flex items-center text-lg font-medium"><LogIn className="mr-2 h-5 w-5"/>Entrar</Link></SheetClose>
                      <SheetClose asChild><Link href="/auth/signup"><Button className="w-full bg-zaca-azul hover:bg-zaca-azul/90"><UserPlus className="mr-2 h-5 w-5"/>Criar Conta</Button></Link></SheetClose>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
        </div>
      </div>
    </header>
  );
}

