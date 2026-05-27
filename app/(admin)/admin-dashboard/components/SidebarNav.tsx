'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Package,
  Shapes,
  Palette,
  Send,
  DropletsIcon,
  LayoutTemplate,
  Bell,
  ShieldAlert
} from 'lucide-react';

export function SidebarNav({ isMobile = false, isCollapsed = false }: { isMobile?: boolean, isCollapsed?: boolean }) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Painel",
      items: [
        { href: "/admin-dashboard", label: "Visão Geral", icon: LayoutDashboard },
      ]
    },
    {
      title: "Gestão",
      items: [
        { href: "/admin-dashboard/users", label: "Usuários", icon: Users },
        { href: "/admin-dashboard/products", label: "Produtos", icon: Package },
        { href: "/admin-dashboard/categories", label: "Categorias", icon: Shapes },
      ]
    },
    {
      title: "Marketing",
      items: [
        { href: "/admin-dashboard/marketing", label: "Emails", icon: Send },
        { href: "/admin-dashboard/notifications", label: "Alertas", icon: Bell },
      ]
    },
    {
      title: "Design",
      items: [
        { href: "/admin-dashboard/homepage-sections", label: "Home", icon: LayoutTemplate },
        { href: "/admin-dashboard/banners", label: "Banners", icon: DropletsIcon },
        { href: "/admin-dashboard/theme", label: "Tema", icon: Palette },
      ]
    }
  ];

  return (
    <TooltipProvider delayDuration={0}>
        <nav className={cn("flex flex-col gap-6 font-medium text-sm transition-all duration-300", (isMobile || !isCollapsed) ? "px-3" : "px-2 items-center")}>
        {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={cn("flex flex-col gap-1 w-full", isCollapsed && "items-center")}>
            {(!isCollapsed || isMobile) && (
                <h4 className="px-3 text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">
                    {group.title}
                </h4>
            )}
            {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin-dashboard" && pathname.startsWith(`${item.href}/`));
                
                const LinkContent = (
                    <Link
                        href={item.href}
                        className={cn(
                        "flex items-center rounded-lg py-2 transition-all relative group",
                        isCollapsed && !isMobile ? "justify-center w-10 h-10 px-0" : "px-3 gap-3 w-full",
                        isActive
                            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        {/* Active Indicator Line */}
                        {isActive && (
                            <div className="absolute left-0 top-1 bottom-1 w-1 bg-red-600 dark:bg-red-500 rounded-r-full" />
                        )}
                        <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-red-600 dark:text-red-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300", isCollapsed && !isMobile && "h-5 w-5")} />
                        {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </Link>
                );

                if (isCollapsed && !isMobile) {
                    return (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                {LinkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="ml-2 bg-slate-900 text-white border-slate-800">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                }

                return <div key={item.href}>{LinkContent}</div>;
            })}
            </div>
        ))}
        
        {/* Admin specific badge */}
        <div className={cn("mt-auto pt-8 transition-all duration-300", (isCollapsed && !isMobile) ? "px-0 flex justify-center" : "px-3")}>
            {(isCollapsed && !isMobile) ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-2.5 flex items-center justify-center cursor-help">
                            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2 bg-slate-900 text-white border-slate-800 flex flex-col gap-1">
                        <span className="font-bold text-red-400">Modo Admin</span>
                        <span className="text-xs text-slate-300">Privilégios totais</span>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-900 dark:text-red-400">Modo Admin</p>
                        <p className="text-xs text-red-700/80 dark:text-red-500/80 mt-1">
                            Você tem privilégios totais de sistema.
                        </p>
                    </div>
                </div>
            )}
        </div>
        </nav>
    </TooltipProvider>
  );
}