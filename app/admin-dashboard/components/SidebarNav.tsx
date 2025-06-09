"use client"; // Este componente usa o hook usePathname, então precisa ser um Client Component

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Shapes,
  Palette,
  Send,
  DropletsIcon,
  LayoutTemplate,
} from 'lucide-react';

export function SidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin-dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/admin-dashboard/users", label: "Usuários", icon: Users },
    { href: "/admin-dashboard/categories", label: "Categorias", icon: Shapes },
    { href: "/admin-dashboard/products", label: "Produtos", icon: Package },
    { href: "/admin-dashboard/marketing", label: "Email Marketing", icon: Send },
    { href: "/admin-dashboard/homepage-sections", label: "Seções da Home", icon: LayoutTemplate },
    { href: "/admin-dashboard/banners", label: "Criar Banner", icon: DropletsIcon },
    { href: "/admin-dashboard/theme", label: "Aparência", icon: Palette },
  ];

  return (
    <nav className={`grid items-start gap-1 text-sm font-medium ${isMobile ? 'px-4' : 'px-2'}`}>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-400 transition-all hover:text-slate-900 dark:hover:text-slate-50",
            pathname === item.href && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}