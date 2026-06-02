import { cn } from '@/lib/utils';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-border bg-background',
        className,
      )}
    >
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground md:flex-row">
        <p>
          &copy; {currentYear} Agenda Tracker. Plataforma de Capacitaciones.
        </p>
        <p className="text-xs">Hecho con React + TanStack Router + Vite</p>
      </div>
    </footer>
  );
}
