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
  Store,
  LineChart,
  BotMessageSquare, // Ícone para o Agente Ana
} from 'lucide-react';
import { checkAgentAccess } from '@/app/actions/checkSubscription';
import { useEffect, useState } from 'react';

const navGroups = [
  {
    title: 'Visão Geral',
    items: [
      { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
      { href: '/dashboard/sales', label: 'Vendas & Reservas', icon: ShoppingBag },
    ]
  },
  {
    title: 'Gestão de Loja',
    items: [
      { href: '/dashboard/add-product', label: 'Adicionar Item', icon: PlusCircle },
      { href: '/my-reservations', label: 'Meus Favoritos', icon: Store },
    ]
  },
  {
    title: 'Marketing & SEO',
    items: [
      { href: '/dashboard/link-shortener', label: 'Links Encurtados', icon: LinkIcon },
    ]
  },
  {
    title: 'Preferências',
    items: [
      { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
    ]
  }
];

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const [hasAgentAccess, setHasAgentAccess] = useState(false);

  useEffect(() => {
    async function verifyAccess() {
      const result = await checkAgentAccess();
      if (result.hasAccess) {
        setHasAgentAccess(true);
      }
    }
    verifyAccess();
  }, []);

  // Clona e modifica os navGroups para adicionar o Agente Ana se tiver acesso
  const dynamicNavGroups = navGroups.map(group => {
    if (group.title === 'Gestão de Loja') {
      const newItems = [...group.items];
      if (hasAgentAccess) {
        // Insere logo no topo da gestão de loja
        newItems.unshift({ href: '/dashboard/agent', label: 'Agente Ana (IA)', icon: BotMessageSquare });
      }
      return { ...group, items: newItems };
    }
    return group;
  });

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col gap-6 px-4 py-6">
        
        {dynamicNavGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-col gap-2">
                {/* Group Title */}
                <h4 className={cn(
                    "text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-all duration-300",
                    isCollapsed ? "text-center opacity-0 h-0 overflow-hidden" : "px-3 mb-1"
                )}>
                    {group.title}
                </h4>

                {/* Items */}
                {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center h-10 rounded-lg text-sm font-medium transition-all duration-200 group',
                                    isActive
                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-white shadow-sm border-l-2 border-primary'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white border-l-2 border-transparent',
                                    isCollapsed ? 'justify-center w-12 border-l-0' : 'justify-start px-3 gap-3'
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 shrink-0 transition-colors",
                                    isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                                )} />
                                <span
                                    className={cn(
                                    'transition-all duration-300',
                                    isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right" align="center" className="font-medium bg-slate-900 text-white border-slate-800">
                                {item.label}
                            </TooltipContent>
                        )}
                        </Tooltip>
                    );
                })}
            </div>
        ))}

        {/* Separator for bottom actions */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

        {/* Link adicional para voltar para a Home */}
        <Tooltip>
            <TooltipTrigger asChild>
            <Link
                href="/"
                className={cn(
                'flex items-center h-10 rounded-lg text-sm font-medium transition-all duration-200 group',
                'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white border-l-2 border-transparent',
                isCollapsed ? 'justify-center w-12 border-l-0' : 'justify-start px-3 gap-3'
                )}
            >
                <Home className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                <span
                className={cn(
                    'transition-all duration-300',
                    isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                )}
                >
                Voltar para o Site
                </span>
            </Link>
            </TooltipTrigger>
            {isCollapsed && (
            <TooltipContent side="right" align="center" className="font-medium bg-slate-900 text-white border-slate-800">
                Voltar para o Site
            </TooltipContent>
            )}
        </Tooltip>

      </nav>
    </TooltipProvider>
  );
}
