import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/authStore';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

export interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export function AppLayout({ children, showSidebar = true, className }: AppLayoutProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const shouldUseAppShell = showSidebar && isAuthenticated;

  if (!shouldUseAppShell) {
    return (
      <div className={cn('flex min-h-screen flex-col bg-background', className)}>
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className={cn('flex-1', className)}>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
