import { Link, createFileRoute } from '@tanstack/react-router';
import { Calendar, CheckCircle2, Clock, GraduationCap, PlusCircle, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMisCapacitaciones, useCapacitaciones } from '@/hooks/useCapacitaciones';
import { useAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { CapacitacionCard } from '@/components/capacitacion/CapacitacionCard';
import { EmptyState } from '@/components/capacitacion/EmptyState';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexPage,
});

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function DashboardIndexPage() {
  const user = useAuthStore((s) => s.user);
  const isJefe = useAuthStore((s) => s.esJefe());
  const misCapQuery = useMisCapacitaciones();
  const proximasQuery = useCapacitaciones({ estado: 'programada' });
  const areasQuery = useAreas();

  const misCapacitaciones = misCapQuery.data ?? [];
  const proximas = proximasQuery.data ?? [];
  const areas = areasQuery.data ?? [];

  const today = todayIso();
  const misProximas = misCapacitaciones
    .filter((c) => c.fecha >= today && c.estado === 'programada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
    .slice(0, 5);

  const totalInscritas = misCapacitaciones.length;
  const completadas = misCapacitaciones.filter((c) => c.estado === 'completada').length;
  const proximasCount = misCapacitaciones.filter(
    (c) => c.fecha >= today && c.estado === 'programada',
  ).length;
  const cupoLibreTotal = proximas
    .filter((c) => c.fecha >= today)
    .reduce((acc, c) => acc + Math.max(0, c.max_participantes - c.inscritos), 0);

  const areaMap = new Map(areas.map((a) => [a.id, a.nombre]));

  const isLoading = misCapQuery.isLoading || proximasQuery.isLoading;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          Hola, {user?.nombre} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Acá tenés un resumen de tus capacitaciones y novedades de tu area.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Inscripciones totales"
          value={totalInscritas}
          accent="text-primary"
        />
        <StatCard
          icon={Clock}
          label="Proximas activas"
          value={proximasCount}
          accent="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completadas"
          value={completadas}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="Cupos libres"
          value={cupoLibreTotal}
          accent="text-sky-600 dark:text-sky-400"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis proximas capacitaciones</h2>
          {misProximas.length > 0 && (
            <Button asChild variant="link" size="sm">
              <Link to="/capacitaciones">Ver todas</Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="ml-2 text-sm">Cargando...</span>
          </div>
        ) : misProximas.length === 0 ? (
          <EmptyState
            title="Aun no te inscribiste a ninguna capacitacion"
            description="Explora la lista y registrare en las que te interesen."
            action={
              <Button asChild size="sm">
                <Link to="/capacitaciones">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Ver capacitaciones
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {misProximas.map((c) => (
              <CapacitacionCard
                key={c.id}
                capacitacion={c}
                areaNombre={areaMap.get(c.area_id)}
                showRegisterButton={false}
                showActions
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Accesos rapidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            to="/capacitaciones"
            title="Todas las capacitaciones"
            description="Explora y filtrá todas las disponibles."
            icon={Calendar}
          />
          {isJefe && (
            <>
              <QuickLink
                to="/capacitaciones/crear"
                title="Crear capacitacion"
                description="Programá una nueva capacitacion para tu area."
                icon={PlusCircle}
              />
              <QuickLink
                to="/dashboard/area"
                title="Mi area"
                description="Gestioná al personal y las capacitaciones del area."
                icon={Users}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}

function StatCard({ icon: Icon, label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

interface QuickLinkProps {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuickLink({ to, title, description, icon: Icon }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
      <div className="flex-1 space-y-0.5">
        <div className="text-sm font-semibold group-hover:text-primary">{title}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
