import { Link, useRouterState } from '@tanstack/react-router';
import { CalendarDaysIcon } from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/area': 'Mi area',
  '/capacitaciones': 'Capacitaciones',
  '/capacitaciones/crear': 'Crear capacitacion',
};

function titleForPath(pathname: string): string {
  if (pathname.startsWith('/capacitaciones/') && pathname.includes('/asistencia')) {
    return 'Asistencia';
  }
  if (pathname.startsWith('/capacitaciones/')) {
    return 'Detalle de capacitacion';
  }
  return TITLES[pathname] ?? 'Agenda Tracker';
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
          <CalendarDaysIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Agenda</span>
        </Link>
        <h1 className="hidden text-base font-medium md:block">{titleForPath(pathname)}</h1>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
