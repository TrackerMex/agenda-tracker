import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';

export const Route = createFileRoute('/capacitaciones/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: CapacitacionLayout,
});

function CapacitacionLayout() {
  return <Outlet />;
}
