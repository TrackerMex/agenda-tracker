import { createFileRoute } from '@tanstack/react-router';
import { OAuthSimulationForm } from '@/components/auth/OAuthSimulationForm';

export const Route = createFileRoute('/auth/outlook-callback')({
  component: OutlookCallbackPage,
});

function OutlookCallbackPage() {
  return <OAuthSimulationForm provider="outlook" />;
}
