import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

export interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export function AppLayout({ children, showSidebar = true, className }: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background', className)}>
      <Navbar />
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
