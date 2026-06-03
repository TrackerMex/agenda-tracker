import { Link } from '@tanstack/react-router';
import { Calendar, LogOut, User } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout(): void {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      )}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>Agenda Tracker</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden items-center gap-4 md:flex" aria-label="Navegación principal">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: 'text-foreground' }}
              >
                Dashboard
              </Link>
              <Link
                to="/capacitaciones"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: 'text-foreground' }}
              >
                Capacitaciones
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm md:flex">
                <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{user.nombre}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-ghost"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-primary">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
