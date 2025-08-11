'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Crown,
    Search,
  BadgeCent,
  Wrench, // Ícone importado
  LifeBuoy,
} from 'lucide-react'
import { UserRole } from '@prisma/client'
import { Separator } from '@/components/ui/separator'
import { GlobalSearchCommand } from '../search/GlobalSearchCommand'
import { Skeleton } from '@/components/ui/skeleton'

// Hook para buscar o status do utilizador (assinaturas, etc.)
function useUserStatus() {
    const { data: session, status } = useSession();
    const [userStatus, setUserStatus] = useState({
        hasActiveSubscription: false,
        hasActiveTurboBoost: false,
        hasActiveCarousel: false,
    });

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/user/status')
                .then(res => res.json())
                .then(data => setUserStatus(data))
                .catch(err => console.error("Falha ao buscar status do utilizador:", err));
        }
    }, [status, session]);

    return userStatus;
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const user = session?.user
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingSalesCount, setPendingSalesCount] = useState(0)
  const { hasActiveSubscription, hasActiveTurboBoost, hasActiveCarousel } = useUserStatus()
  const [openSearch, setOpenSearch] = useState(false)

  // Efeito para buscar vendas pendentes
  useEffect(() => {
    if (status === 'authenticated' && user?.role === UserRole.SELLER) {
      fetch('/api/sales/pending-count')
        .then(res => res.ok ? res.json() : { count: 0 })
        .then(data => setPendingSalesCount(data.count || 0));
    }
  }, [status, user]);

  // Efeito para abrir a busca com Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenSearch((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Definições dos links
  const mainNavLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/products', label: 'Achadinhos', icon: Package2 },
    { href: '/services', label: 'Serviços', icon: Wrench }, // Link de serviços adicionado
    { href: '/sellers', label: 'Vendedores', icon: Store },
    { href: '/planos', label: 'Planos', icon: BadgeCent },
  ];
  const userNavLinks = [
    { href: '/dashboard', label: 'Minha Loja', icon: LayoutDashboard },
    { href: '/my-reservations', label: 'Favoritos', icon: Heart },
  ];

  const getAvatarFallback = (name?: string | null) => (name ? name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : <UserCircle2 />);
  
  const avatarRingClass = cn({
      "ring-2 ring-offset-2 ring-offset-background": hasActiveSubscription || hasActiveTurboBoost || hasActiveCarousel,
      "ring-yellow-400": hasActiveSubscription,
      "ring-blue-500": !hasActiveSubscription && hasActiveTurboBoost,
      "ring-red-500": !hasActiveSubscription && !hasActiveTurboBoost && hasActiveCarousel
  });

  return (
    <>
      <GlobalSearchCommand open={openSearch} setOpen={setOpenSearch} />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-slate-800/60">
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/zacalogo.png" alt="Zacaplace Logo" width={180} height={50} priority />
            </Link>
            <nav className="hidden lg:flex">
              <ul className="flex items-center space-x-6 text-sm font-medium">
                {mainNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={cn("transition-colors hover:text-primary", pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground")}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center justify-end gap-x-2">
            
            <div className="hidden lg:flex items-center gap-x-1">
                <Link href='https://wa.me/553197490093' target='_blank'>
                  <Button variant="ghost" size="icon" aria-label="Support">
                    <LifeBuoy className="h-5 w-5" />
                  </Button>
                </Link>
                <Button onClick={() => setOpenSearch(true)} variant="ghost" size="icon" aria-label="Buscar"><Search className="h-5 w-5" /></Button>
                <Link href='/my-reservations'><Button variant="ghost" size="icon" aria-label="Favoritos"><Heart className="h-5 w-5" /></Button></Link>
                {user?.role === UserRole.SELLER && (
                    <Link href='/dashboard/sales' className="relative">
                        <Button variant="ghost" size="icon" aria-label="Minhas Vendas"><ShoppingBag className="h-5 w-5" /></Button>
                        {pendingSalesCount > 0 && <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{pendingSalesCount}</div>}
                    </Link>
                )}
                <Separator orientation="vertical" className="h-6 mx-2" />
                {status === 'loading' ? <Skeleton className="h-10 w-10 rounded-full" /> : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0">
                        <Avatar className={cn("h-10 w-10", avatarRingClass)}>
                        <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                        <AvatarFallback className="bg-primary/10 font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                        </Avatar>
                        {hasActiveSubscription && <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-lg" />}
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user.name}</p><p className="text-xs leading-none text-muted-foreground">{user.email}</p></div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userNavLinks.map(link => (<DropdownMenuItem key={link.href} asChild><Link href={link.href} className='flex items-center'><link.icon className="mr-2 h-4 w-4" />{link.label}</Link></DropdownMenuItem>))}
                        {user.role === UserRole.ADMIN && (<DropdownMenuItem asChild><Link href="/admin-dashboard" className='flex items-center'><UserCircle2 className="mr-2 h-4 w-4" />Painel Admin</Link></DropdownMenuItem>)}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className='flex items-center'><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : <Button asChild><Link href="/auth/signin">Entrar</Link></Button>}
            </div>

            <div className="flex items-center lg:hidden">
                <Link href='https://wa.me/553197490093' target='_blank'>
                  <Button variant="ghost" size="icon" aria-label="Support">
                    <LifeBuoy className="h-5 w-5" />
                  </Button>
                </Link>
                <Button onClick={() => setOpenSearch(true)} variant="ghost" size="icon" aria-label="Buscar"><Search className="h-5 w-5" /></Button>
                <Link href='/my-reservations'><Button variant="ghost" size="icon" aria-label="Favoritos"><Heart className="h-5 w-5" /></Button></Link>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menu"><Menu className="h-6 w-6" /></Button></SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm p-0 flex flex-col">
                        {user ? (
                            <div className="p-4 border-b dark:border-slate-800">
                                <Link href="/dashboard" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
                                <div className="relative">
                                    <Avatar className={cn("h-12 w-12", avatarRingClass)}>
                                        <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                                        <AvatarFallback className="bg-primary/10 font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                                    </Avatar>
                                    {hasActiveSubscription && <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-lg" />}
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
                                    <Image src="/zacalogo.png" alt="Zacaplace Logo" width={150} height={40} />
                                </Link>
                            </div>
                        )}
                        
                        <nav className="flex flex-col space-y-1 p-4 flex-1">
                        {mainNavLinks.map((link) => (
                            <SheetClose key={link.href} asChild>
                            <Link href={link.href} className={cn("flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md", pathname === link.href ? "text-primary bg-muted" : "text-foreground")}>
                                <link.icon className="h-5 w-5" />{link.label}
                            </Link>
                            </SheetClose>
                        ))}
                        <SheetClose asChild>
                          <Link href="https://wa.me/553197490093" target="_blank" className={cn("flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md", "text-foreground")}>
                            <LifeBuoy className="h-5 w-5" />Suporte
                          </Link>
                        </SheetClose>
                        {user ? (
                            <>
                            {userNavLinks.map(link => (
                                <SheetClose key={link.href} asChild><Link href={link.href} className={cn("flex items-center gap-3 text-lg font-medium p-2 rounded-md", pathname === link.href ? "text-primary bg-muted" : "text-foreground")}><link.icon className="h-5 w-5"/>{link.label}</Link></SheetClose>
                            ))}
                            {user.role === UserRole.SELLER && (
                                <SheetClose asChild>
                                    <Link href="/dashboard/sales" className={cn("flex items-center justify-between text-lg font-medium p-2 rounded-md", pathname === '/dashboard/sales' ? "text-primary bg-muted" : "text-foreground")}>
                                        <div className="flex items-center gap-3"><ShoppingBag className="h-5 w-5" />Minhas Vendas</div>
                                        {pendingSalesCount > 0 && <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">{pendingSalesCount}</div>}
                                    </Link>
                                </SheetClose>
                            )}
                            {user.role === UserRole.ADMIN && (<SheetClose asChild><Link href="/admin-dashboard" className={cn("flex items-center gap-3 text-lg font-medium p-2 rounded-md", pathname.startsWith('/admin-dashboard') ? "text-primary bg-muted" : "text-foreground")}><UserCircle2 className="h-5 w-5"/>Painel Admin</Link></SheetClose>)}
                            </>
                        ) : (
                            <>
                            <SheetClose asChild><Link href="/auth/signin" className="flex items-center gap-3 text-lg font-medium p-2 rounded-md"><LogIn className="h-5 w-5"/>Entrar</Link></SheetClose>
                            <SheetClose asChild><Link href="/auth/signup"><Button className="w-full mt-2 bg-primary text-primary-foreground"><UserPlus className="mr-2 h-5 w-5"/>Criar Conta</Button></Link></SheetClose>
                            </>
                        )}
                        </nav>
                        {user && (
                            <div className="p-4 mt-auto border-t dark:border-slate-800">
                                <Button variant="outline" onClick={() => {signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false);}} className="w-full flex items-center"><LogOut className="mr-2 h-5 w-5"/>Sair</Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
