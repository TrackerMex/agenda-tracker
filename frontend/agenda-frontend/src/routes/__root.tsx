import { useEffect } from 'react';
import { Outlet, createRootRouteWithContext, Link, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleAuthLogout() {
      void navigate({ to: '/login', replace: true });
    }
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [navigate]);

  return (
    <AppLayout>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppLayout>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">La página que buscas no existe.</p>
      <Link to="/" className="btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
