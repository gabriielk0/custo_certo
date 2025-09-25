'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookCopy,
  Carrot,
  CookingPot,
  DollarSign,
  LayoutDashboard,
  Lightbulb,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const links = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dishes',
    label: 'Pratos',
    icon: CookingPot,
  },
  {
    href: '/recipes',
    label: 'Receitas & Produtos',
    icon: BookCopy,
  },
  {
    href: '/ingredients',
    label: 'Ingredientes Crus',
    icon: Carrot,
  },
  {
    href: '/expenses',
    label: 'Despesas',
    icon: DollarSign,
  },
  {
    href: '/pricing-analysis',
    label: 'Análise de Preços',
    icon: Lightbulb,
  },
];

export function NavegacaoPrincipal() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col p-2">
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href}>
              <SidebarMenuButton
                isActive={pathname === link.href}
                tooltip={{ children: link.label }}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
