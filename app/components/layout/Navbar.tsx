'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Home,
  Package2,
  Store,
  ShoppingBag,
  Crown,
  Search,
  BadgeCent,
  Wrench,
  LifeBuoy,
  Instagram,
} from 'lucide-react'
import { UserRole } from '@prisma/client'
import { Separator } from '@/components/ui/separator'
import { GlobalSearchCommand } from '../search/GlobalSearchCommand'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { useLocation } from '@/lib/hooks/useLocation'
import { setLocationCookie } from '@/app/actions/location'
import { useRouter } from 'next/navigation'

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

interface NavbarProps {
  initialState?: string;
  initialCity?: string;
}

export default function Navbar({ initialState = '', initialCity = '' }: NavbarProps) {
  const { data: session, status } = useSession()
  const user = session?.user
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingSalesCount, setPendingSalesCount] = useState(0)
  const { hasActiveSubscription, hasActiveTurboBoost, hasActiveCarousel } = useUserStatus()
  const [openSearch, setOpenSearch] = useState(false)
  const router = useRouter()

  const { states, cities, selectedState, setSelectedState, loadingStates, loadingCities } = useLocation(initialState)
  const [localCity, setLocalCity] = useState(initialCity)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const handleSaveLocation = async () => {
    await setLocationCookie(selectedState, localCity)
    setIsLocationModalOpen(false)
    router.refresh()
  }

  // Estado para o hover magnético na nav desktop
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // --- NOVA LÓGICA DE TRANSPARÊNCIA E OCULTAÇÃO NO SCROLL ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Páginas que têm um Hero escuro e não precisam do spacer da Navbar
  const isDarkHeroPage = pathname === '/' || pathname === '/sellers' || pathname === '/products' || pathname === '/services' || pathname?.startsWith('/seller/');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    // Inicializa
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isTransparent = isDarkHeroPage && !isScrolled;
  // isDarkMode: true on dark hero pages even after scrolling, so text/icons stay light
  const isDarkMode = isDarkHeroPage;

  useEffect(() => {
    if (status === 'authenticated' && (user?.role === UserRole.SELLER || user?.role === UserRole.ADMIN)) {
      fetch('/api/sales/pending-count')
        .then(res => res.ok ? res.json() : { count: 0 })
        .then(data => setPendingSalesCount(data.count || 0));
    }
  }, [status, user]);

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

  const mainNavLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/products', label: 'Achadinhos', icon: Package2 },
    { href: '/services', label: 'Serviços', icon: Wrench },
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

      {/* Contêiner de Entrada com Animação */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-500",
          // Layout Pill no Desktop e Fixed Top no Mobile
          "md:top-4 md:left-1/2 md:-translate-x-1/2 md:w-[95%] max-w-7xl md:rounded-full",
          // Hide/Show via CSS transform (apenas no desktop, fixa no mobile)
          isHidden ? "translate-y-0 md:-translate-y-[calc(100%+1rem)] opacity-100 md:opacity-0 pointer-events-auto md:pointer-events-none" : "translate-y-0 opacity-100 pointer-events-auto",
          isTransparent
            ? "bg-transparent border-transparent shadow-none"
            : isDarkHeroPage
              ? "border-b md:border border-white/10 bg-black/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              : "border-b md:border border-border/40 bg-background/80 backdrop-blur-2xl shadow-xl"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <div className="flex items-center gap-4 z-10">
            <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/zacalogo.png"
                alt="Zacaplace Logo"
                width={160} height={45} priority
                style={{ filter: (isTransparent || isDarkMode) ? 'brightness(0) invert(1)' : undefined }}
                className={cn("hidden dark:block", (isTransparent || isDarkMode) && "block dark:block")}
              />
              <Image
                src="/zacalogo.png" alt="Zacaplace Logo" width={160} height={45} priority
                className={cn("block dark:hidden", (isTransparent || isDarkMode) && "hidden")}
              />
            </Link>

            {/* Location Selector */}
            <div className="hidden sm:flex items-center">
              <span className={cn("text-xl font-light mx-2", (isTransparent || isDarkMode) ? "text-white/50" : "text-foreground/30")}>|</span>
              <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className={cn("px-2 py-1 h-auto flex items-center gap-1 rounded-full text-sm font-semibold hover:bg-foreground/5", (isTransparent || isDarkMode) ? "text-white hover:bg-white/10" : "text-foreground")}>
                    <MapPin className="h-4 w-4" />
                    {initialCity && initialState ? `${initialCity}, ${initialState}` : initialState ? initialState : "BR"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-white/10 bg-background/95 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>Onde você está?</DialogTitle>
                    <DialogDescription>
                      Selecione seu Estado e Cidade para ver os produtos mais próximos de você.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex-1 space-y-2 relative">
                        <label className="text-sm font-medium">Estado (UF)</label>
                        <select
                            value={selectedState}
                            onChange={(e) => {
                                setSelectedState(e.target.value);
                                setLocalCity('');
                            }}
                            disabled={loadingStates}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
                        >
                            <option value="">Todo o Brasil</option>
                            {states.map((s) => (
                                <option key={s.id} value={s.sigla}>{s.nome} ({s.sigla})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 space-y-2 relative">
                        <label className="text-sm font-medium">Cidade (Opcional)</label>
                        <select
                            value={localCity}
                            onChange={(e) => setLocalCity(e.target.value)}
                            disabled={loadingCities || !selectedState}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                            <option value="">Todas as Cidades</option>
                            {cities.map((c) => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={handleSaveLocation} className="w-full mt-4">
                      Aplicar Filtro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Navegação Desktop Glassmorphic */}
          <nav className="hidden lg:flex flex-1 justify-center relative z-0" onMouseLeave={() => setHoveredIndex(null)}>
            <ul className={cn(
              "flex items-center p-1 rounded-full border transition-colors duration-500",
              isTransparent
                ? "bg-black/20 border-white/10 backdrop-blur-md"
                : isDarkMode
                  ? "bg-white/5 border-white/10 backdrop-blur-md"
                  : "bg-foreground/5 border-foreground/10"
            )}>
              {mainNavLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <li
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    {/* Hover Background Magnético */}
                    <AnimatePresence>
                      {hoveredIndex === idx && (
                        <motion.div
                          layoutId="hover-bg"
                          className={cn("absolute inset-0 rounded-full -z-10", (isTransparent || isDarkMode) ? "bg-white/20" : "bg-primary/10")}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Active Background Fixo */}
                    {isActive && (
                      <motion.div
                        layoutId="active-bg"
                        className={cn("absolute inset-0 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--primary),0.5)]", (isTransparent || isDarkMode) ? "bg-white" : "bg-primary")}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}

                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors z-10",
                        isActive
                          ? ((isTransparent || isDarkMode) ? "text-black" : "text-primary-foreground")
                          : ((isTransparent || isDarkMode) ? "text-white/80 hover:text-white" : "text-foreground/70 hover:text-foreground")
                      )}
                    >
                      <link.icon className={cn("h-4 w-4",
                        isActive ? ((isTransparent || isDarkMode) ? "text-black" : "text-primary-foreground") : ((isTransparent || isDarkMode) ? "text-white" : "text-primary")
                      )} />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Ações da Direita (Ícones e Avatar) */}
          <div className="flex items-center justify-end gap-x-2 z-10">
            <div className="hidden lg:flex items-center gap-x-1">
              <motion.a
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                href="https://www.instagram.com/zacaplace_setelagoas"
                target="_blank"
                rel="noopener noreferrer"
                className={cn("flex items-center justify-center rounded-full h-9 w-9 border shadow-sm transition-colors", (isTransparent || isDarkMode) ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-accent/50 hover:bg-accent border-foreground/5")}
              >
                <span className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full p-1">
                  <Instagram className="h-4 w-4 text-white" />
                </span>
              </motion.a>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href='https://wa.me/553197490093' target='_blank'>
                  <Button variant="ghost" size="icon" aria-label="Support" className={cn("rounded-full transition-colors", (isTransparent || isDarkMode) ? "text-white hover:bg-white/20 hover:text-white" : "hover:bg-accent/80")}>
                    <LifeBuoy className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setOpenSearch(true)} variant="ghost" size="icon" aria-label="Buscar" className={cn("rounded-full transition-colors", (isTransparent || isDarkMode) ? "text-white hover:bg-white/20 hover:text-white" : "hover:bg-accent/80")}>
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href='/my-reservations'>
                  <Button variant="ghost" size="icon" aria-label="Favoritos" className={cn("rounded-full transition-colors", (isTransparent || isDarkMode) ? "text-white hover:bg-white/20 hover:text-white" : "hover:bg-accent/80")}>
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              {(user?.role === UserRole.SELLER || user?.role === UserRole.ADMIN) && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link href='/dashboard/sales' className="relative inline-block">
                    <Button variant="ghost" size="icon" aria-label="Minhas Vendas" className={cn("rounded-full transition-colors", (isTransparent || isDarkMode) ? "text-white hover:bg-white/20 hover:text-white" : "hover:bg-accent/80")}>
                      <ShoppingBag className="h-5 w-5" />
                    </Button>
                    {pendingSalesCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive shadow-lg shadow-destructive/40 text-[10px] font-bold text-destructive-foreground ring-2 ring-background"
                      >
                        {pendingSalesCount}
                      </motion.div>
                    )}
                  </Link>
                </motion.div>
              )}

              <Separator orientation="vertical" className={cn("h-6 mx-2", (isTransparent || isDarkMode) ? "bg-white/20" : "bg-foreground/10")} />

              {status === 'loading' ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative h-11 w-11 rounded-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className={cn("h-10 w-10 transition-shadow", avatarRingClass)}>
                        <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                        <AvatarFallback className="bg-primary/10 font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                      </Avatar>
                      {hasActiveSubscription && <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-md" />}
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-foreground/5" />
                    {userNavLinks.map(link => (
                      <DropdownMenuItem key={link.href} asChild className="rounded-md m-1 cursor-pointer focus:bg-primary/10">
                        <Link href={link.href} className='flex items-center'>
                          <link.icon className="mr-2 h-4 w-4 text-primary" />{link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {(user.role === UserRole.ADMIN) && (
                      <DropdownMenuItem asChild className="rounded-md m-1 cursor-pointer focus:bg-primary/10">
                        <Link href="/admin-dashboard" className='flex items-center'>
                          <UserCircle2 className="mr-2 h-4 w-4 text-primary" />Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-foreground/5" />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className='rounded-md m-1 cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive flex items-center'>
                      <LogOut className="mr-2 h-4 w-4" />Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className={cn("rounded-full shadow-lg transition-all", (isTransparent || isDarkMode) ? "bg-white text-black hover:bg-white/90 shadow-white/20" : "shadow-primary/20 hover:shadow-primary/40")}><Link href="/auth/signin">Entrar</Link></Button>
              )}
            </div>

            {/* --- NAVEGAÇÃO MOBILE --- */}
            <div className="flex items-center lg:hidden z-10">
              <Button onClick={() => setOpenSearch(true)} variant="ghost" size="icon" aria-label="Buscar" className={cn("rounded-full", (isTransparent || isDarkMode) ? "text-white" : "")}>
                <Search className="h-5 w-5" />
              </Button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menu" className={cn("rounded-full", (isTransparent || isDarkMode) ? "text-white" : "")}>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l-white/10">
                  {user ? (
                    <div className="p-6 border-b border-foreground/10 bg-primary/5">
                      <Link href="/dashboard" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="relative">
                          <Avatar className={cn("h-14 w-14", avatarRingClass)}>
                            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                            <AvatarFallback className="bg-primary/20 font-bold">{getAvatarFallback(user.name)}</AvatarFallback>
                          </Avatar>
                          {hasActiveSubscription && <Crown className="absolute -top-1 -right-1 h-6 w-6 text-yellow-400 fill-yellow-400 rotate-12 drop-shadow-md" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold leading-none truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate mt-1">{user.email}</p>
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6 border-b border-foreground/10 flex items-center justify-center bg-primary/5">
                      <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <Image src="/zacalogo.png" alt="Zacaplace Logo" width={180} height={50} className="dark:invert" />
                      </Link>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <nav className="flex flex-col space-y-2">
                      {mainNavLinks.map((link, i) => (
                        <SheetClose key={link.href} asChild>
                          <Link href={link.href} className="block">
                            <motion.div
                              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                              className={cn(
                                "flex items-center gap-4 text-base font-medium transition-all p-4 rounded-xl border border-transparent",
                                pathname === link.href ? "text-primary bg-primary/10 border-primary/20" : "text-foreground/80 hover:bg-foreground/5"
                              )}
                            >
                              <div className={cn("p-2 rounded-lg", pathname === link.href ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-foreground/5")}>
                                <link.icon className="h-5 w-5" />
                              </div>
                              {link.label}
                            </motion.div>
                          </Link>
                        </SheetClose>
                      ))}

                      <Separator className="my-4 bg-foreground/10" />

                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 px-2">Suporte & Social</h4>

                      <SheetClose asChild>
                        <Link href="https://www.instagram.com/zacaplace_setelagoas" target="_blank" className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 text-foreground/80 transition-colors">
                          <span className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-lg p-2 shadow-md">
                            <Instagram className="h-4 w-4 text-white" />
                          </span>
                          Siga no Instagram
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="https://wa.me/553197490093" target="_blank" className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 text-foreground/80 transition-colors">
                          <div className="p-2 rounded-lg bg-green-500 text-white shadow-md shadow-green-500/30">
                            <LifeBuoy className="h-4 w-4" />
                          </div>
                          Central de Ajuda
                        </Link>
                      </SheetClose>
                    </nav>
                  </div>

                  <div className="p-6 mt-auto border-t border-foreground/10 bg-background/50 backdrop-blur-md">
                    {user ? (
                      <Button variant="destructive" onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }} className="w-full flex items-center rounded-xl h-12 shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all">
                        <LogOut className="mr-2 h-5 w-5" />Terminar Sessão
                      </Button>
                    ) : (
                      <div className='flex flex-col gap-3'>
                        <SheetClose asChild><Link href="/auth/signin" className='w-full'><Button variant={'outline'} className='w-full rounded-xl h-12 border-primary/20 text-primary hover:bg-primary/5'>Acesse sua conta</Button></Link></SheetClose>
                        <SheetClose asChild><Link href="/auth/signup" className='w-full'><Button className="w-full rounded-xl h-12 shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50">Criar Conta Grátis</Button></Link></SheetClose>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}