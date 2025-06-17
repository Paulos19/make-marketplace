import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Package,
  Shapes,
  Menu,
  LogOut,
  Home,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@prisma/client';
import { SidebarNav } from './components/SidebarNav'; // Criaremos este componente a seguir

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    redirect('/');
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-slate-100 dark:bg-slate-950">
      {/* Sidebar para Desktop */}
      <aside className="hidden border-r bg-white dark:bg-slate-900/70 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/zacalogo2.svg" alt="Zacaplace Logo" width={140} height={35} />
            </Link>
          </div>
          <div className="flex-1">
            <SidebarNav />
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-col">
        {/* Cabeçalho para Mobile */}
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-slate-900/70 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Image src="/zacalogo2.svg" alt="Zacaplace Logo" width={140} height={35} />
                  </Link>
              </div>
              <SidebarNav isMobile={true} />
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            {/* Espaço para um futuro campo de busca, se necessário */}
          </div>
          
          <Avatar className="h-9 w-9">
            <AvatarImage src={session.user.image ?? undefined} alt="Avatar do Admin" />
            <AvatarFallback>{session.user.name?.charAt(0).toUpperCase() ?? 'A'}</AvatarFallback>
          </Avatar>
        </header>

        {/* Renderiza a página filha (page.tsx, users/page.tsx, etc.) */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}