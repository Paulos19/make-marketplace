'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  LogOut,
  UserCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SidebarNav } from './components/SidebarNav';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const getAvatarFallback = (name?: string | null) =>
    name
      ? name
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : <UserCircle2 />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar para Desktop (retrátil) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className={cn(!isSidebarCollapsed && 'flex-grow')}>
            <Image
              src="/zacalogo.png"
              alt="Zacaplace Logo"
              width={isSidebarCollapsed ? 40 : 130}
              height={40}
              className="transition-all duration-300"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <SidebarNav isCollapsed={isSidebarCollapsed} />
        </div>
        <div className={cn("border-t p-4", isSidebarCollapsed && "p-2")}>
            <Button variant="outline" size={isSidebarCollapsed ? "icon" : "default"} onClick={() => signOut({ callbackUrl: '/' })} className="w-full">
              <LogOut className={cn(!isSidebarCollapsed && "mr-2", "h-4 w-4")} />
              {!isSidebarCollapsed && "Sair"}
            </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header para Mobile */}
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-900 px-4 lg:hidden">
          <Link href="/">
            <Image src="/zacalogo.png" alt="Zacaplace Logo" width={130} height={35} />
          </Link>
          <div className='flex items-center gap-2'>
             <Avatar>
              <AvatarImage src={session?.user?.image ?? undefined} alt="Avatar"/>
              <AvatarFallback>{getAvatarFallback(session?.user?.name)}</AvatarFallback>
            </Avatar>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                 <div className="flex h-16 items-center border-b px-4">
                    <Link href="/">
                        <Image src="/zacalogo.png" alt="Zacaplace Logo" width={130} height={35} />
                    </Link>
                 </div>
                <SidebarNav isCollapsed={false} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Conteúdo Principal da Página com scroll independente */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
