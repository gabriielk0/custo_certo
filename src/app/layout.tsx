import type { Metadata } from 'next';
import { Torradeira } from '@/components/ui/toaster';
import { CabecalhoPagina } from '@/components/page-header';
import { NavegacaoPrincipal } from '@/components/main-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Custo Certo',
  description: 'Gerencie os custos das suas receitas com precisão.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <div className="relative flex min-h-screen w-full">
            <Sidebar
              variant="sidebar"
              collapsible="icon"
              className="border-r bg-card"
            >
              <SidebarHeader className="border-b">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold"
                >
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                  <span className="text-lg">Custo Certo</span>
                </Link>
              </SidebarHeader>
              <SidebarContent>
                <NavegacaoPrincipal />
              </SidebarContent>
            </Sidebar>
            <div className="flex flex-1 flex-col">
              <CabecalhoPagina />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          <Torradeira />
        </SidebarProvider>
      </body>
    </html>
  );
}
