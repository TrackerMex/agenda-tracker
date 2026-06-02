import { createFileRoute } from '@tanstack/react-router';
import { OAuthSimulationForm } from '@/components/auth/OAuthSimulationForm';

export const Route = createFileRoute('/auth/google-callback')({
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  return <OAuthSimulationForm provider="google" />;
}
