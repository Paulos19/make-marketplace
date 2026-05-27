'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarNav } from './SidebarNav';
import { cn } from '@/lib/utils';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    image?: string | null;
  };
}

export function AdminLayoutShell({ children, user }: AdminLayoutShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Recover state from localStorage if needed, or just default to open
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(newState));
  };

  if (!isMounted) {
    return null; // Avoid hydration mismatch on initial render
  }

  return (
    <div className={cn(
        "grid min-h-screen w-full transition-all duration-300 bg-slate-50 dark:bg-slate-950",
        isCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]"
    )}>
      {/* Sidebar para Desktop */}
      <aside className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl h-screen sticky top-0 transition-all duration-300 z-40 relative group">
        
        {/* Toggle Button */}
        <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleSidebar}
            className="absolute -right-4 top-20 z-50 rounded-full w-8 h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <div className={cn("flex h-16 items-center border-b border-slate-200 dark:border-slate-800 shrink-0 transition-all duration-300 overflow-hidden", isCollapsed ? "justify-center px-0" : "px-6")}>
          <Link href="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80 whitespace-nowrap">
            {isCollapsed ? (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 font-black px-2 py-1 rounded-md text-xs">AD</div>
            ) : (
                <>
                    <Image src="/zacalogo.png" alt="Zacaplace Logo" width={140} height={35} className="dark:brightness-200 dark:grayscale" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-sm ml-2">ADMIN</span>
                </>
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-col min-w-0">
        {/* Cabeçalho */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300">
          {/* Menu Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-slate-200 dark:border-slate-800"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px] border-r-slate-200 dark:border-r-slate-800 bg-white dark:bg-slate-900">
              <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Image src="/zacalogo.png" alt="Zacaplace Logo" width={140} height={35} className="dark:brightness-200 dark:grayscale" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-sm ml-2">ADMIN</span>
                  </Link>
              </div>
              <div className="flex-1 overflow-y-auto py-6">
                  <SidebarNav isMobile={true} />
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            {/* Espaço para busca futura */}
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                  <span className="text-xs text-red-600 dark:text-red-500 font-medium tracking-wider uppercase">Super Admin</span>
              </div>
              <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 shadow-sm ring-2 ring-red-500/20">
                <AvatarImage src={user.image ?? undefined} alt="Avatar do Admin" />
                <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold">{user.name?.charAt(0).toUpperCase() ?? 'A'}</AvatarFallback>
              </Avatar>
          </div>
        </header>

        {/* Renderiza a página filha */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
