import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex flex-col gap-12 py-8">
      <section className="flex flex-col items-center gap-4 text-center">
        <Calendar className="h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Plataforma de Agendas para Capacitaciones
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Gestioná las capacitaciones por área, sincronizá con Google Calendar y Outlook, y
          mantené a tu equipo siempre actualizado.
        </p>
        <div className="flex gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              Ir a mi dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-secondary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={<Users className="h-6 w-6" />}
          title="Gestión por área"
          description="Cada área tiene su jefe y personal asignado, con dashboards dedicados."
        />
        <FeatureCard
          icon={<Calendar className="h-6 w-6" />}
          title="Sincronización de calendarios"
          description="Conectá con Google Calendar y Outlook para mantener los eventos siempre actualizados."
        />
        <FeatureCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Control de asistencia"
          description="Marcá quién asistió y generá reportes de participación en segundos."
        />
        <FeatureCard
          icon={<Clock className="h-6 w-6" />}
          title="Notificaciones automáticas"
          description="Email de confirmación y recordatorios para cada capacitación."
        />
        <FeatureCard
          icon={<Users className="h-6 w-6" />}
          title="Roles y permisos"
          description="RBAC granular: usuario, capacitador, jefe de área y admin."
        />
        <FeatureCard
          icon={<Calendar className="h-6 w-6" />}
          title="Reportes"
          description="Visualizá métricas de asistencia y uso por área y período."
        />
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
