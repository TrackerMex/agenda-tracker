import { Link } from '@tanstack/react-router';
import { Calendar, Home, PlusCircle, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  className?: string;
}

interface SidebarItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requireJefe?: boolean;
}

const ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'Mi Dashboard', icon: Home },
  { to: '/capacitaciones', label: 'Capacitaciones', icon: Calendar },
  { to: '/capacitaciones/crear', label: 'Crear Capacitación', icon: PlusCircle, requireJefe: true },
  { to: '/dashboard/area', label: 'Mi Área', icon: Users, requireJefe: true },
];

export function Sidebar({ className }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isJefe = user?.roles?.includes('jefe_area') ?? false;

  if (!isAuthenticated) {
    return null;
  }

  const visibleItems = ITEMS.filter((item) => !item.requireJefe || isJefe);

  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 border-r border-border bg-card md:block',
        className,
      )}
      aria-label="Navegación lateral"
    >
      <nav className="flex flex-col gap-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
