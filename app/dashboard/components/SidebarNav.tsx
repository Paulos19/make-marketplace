'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  ShoppingBag,
  Link as LinkIcon,
  Home,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/add-product', label: 'Adicionar Item', icon: PlusCircle },
  { href: '/dashboard/sales', label: 'Minhas Vendas', icon: ShoppingBag },
  { href: '/dashboard/link-shortener', label: 'Encurtador', icon: LinkIcon },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col gap-2 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center h-10 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-muted-foreground',
                    isCollapsed ? 'justify-center w-12' : 'justify-start px-3 gap-3'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      'transition-all duration-300',
                      isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
        {/* Link adicional para voltar para a Home */}
         <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={cn(
                    'flex items-center h-10 rounded-md text-sm font-medium transition-colors mt-8',
                    'hover:bg-accent hover:text-accent-foreground',
                    'text-muted-foreground',
                    isCollapsed ? 'justify-center w-12' : 'justify-start px-3 gap-3'
                  )}
                >
                  <Home className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      'transition-all duration-300',
                      isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    Voltar para o Site
                  </span>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" align="center">
                  Voltar para o Site
                </TooltipContent>
              )}
            </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
