import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="agenda-ui-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
