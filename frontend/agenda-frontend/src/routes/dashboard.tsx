import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return <Outlet />;
}
