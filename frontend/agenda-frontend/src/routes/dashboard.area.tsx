import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  PlusCircle,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePersonalArea, useAreas } from '@/hooks/useAreas';
import { useCapacitacionesByArea } from '@/hooks/useCapacitaciones';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonalTable } from '@/components/capacitacion/PersonalTable';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import { CapacitacionStatusBadge } from '@/components/capacitacion/CapacitacionStatusBadge';
import type { CapacitacionEstado } from '@/types';

export const Route = createFileRoute('/dashboard/area')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!user?.roles?.includes('jefe_area') && !user?.roles?.includes('admin')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: DashboardAreaPage,
});

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

function DashboardAreaPage() {
  const user = useAuthStore((s) => s.user);
  const areaId = user?.area_id ?? null;
  const isAdmin = user?.roles?.includes('admin') ?? false;

  const areasQuery = useAreas();
  const personalQuery = usePersonalArea(areaId);
  const capsQuery = useCapacitacionesByArea(areaId);

  const personal = personalQuery.data ?? [];
  const caps = capsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const area = areas.find((a) => a.id === areaId);
  const today = todayIso();

  const capacitadores = personal.filter((p) =>
    p.roles.some((r) => r === 'capacitador' || r === 'jefe_area' || r === 'admin'),
  );
  const capsProgramadas = caps.filter((c) => c.estado === 'programada');
  const capsFuturas = capsProgramadas.filter((c) => c.fecha >= today);
  const capsPasadas = capsProgramadas.filter((c) => c.fecha < today);
  const totalInscritos = caps.reduce((acc, c) => acc + c.inscritos, 0);

  if (!isAdmin && areaId === null) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <EmptyState
          title="Sin area asignada"
          description="Tu usuario no tiene un area asignada. Contacta al administrador para que te asigne un area."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al dashboard
        </Link>
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">{area?.nombre ?? 'Mi area'}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestioná al personal, las capacitaciones y la asistencia de tu area.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Personas en el area"
          value={personal.length}
          accent="text-primary"
        />
        <StatCard
          icon={GraduationCap}
          label="Capacitadores"
          value={capacitadores.length}
          accent="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Calendar}
          label="Capacitaciones activas"
          value={capsProgramadas.length}
          accent="text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Inscriptos totales"
          value={totalInscritos}
          accent="text-emerald-600 dark:text-emerald-400"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personal del area</h2>
          <Badge variant="outline">{personal.length}</Badge>
        </div>
        <PersonalTable
          personal={personal}
          isLoading={personalQuery.isLoading}
          emptyTitle="Aun no hay personal"
          emptyDescription="Cuando se asignen usuarios al area, apareceran en esta tabla."
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Capacitaciones del area</h2>
          <Button asChild size="sm">
            <Link to="/capacitaciones/crear">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Nueva capacitacion
            </Link>
          </Button>
        </div>

        {capsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="ml-2 text-sm">Cargando capacitaciones...</span>
          </div>
        ) : caps.length === 0 ? (
          <EmptyState
            title="Aun no hay capacitaciones"
            description="Programa la primera capacitacion de tu area."
            action={
              <Button asChild size="sm">
                <Link to="/capacitaciones/crear">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Crear capacitacion
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {capsFuturas.length > 0 && (
              <CapGroup
                title="Proximas"
                icon={Clock}
                capacitaciones={capsFuturas}
              />
            )}
            {capsPasadas.length > 0 && (
              <CapGroup
                title="Realizadas (pendientes de cerrar)"
                icon={CheckCircle2}
                capacitaciones={capsPasadas}
              />
            )}
            {caps.some((c) => c.estado === 'completada' || c.estado === 'cancelada') && (
              <CapGroup
                title="Cerradas"
                icon={Calendar}
                capacitaciones={caps.filter(
                  (c) => c.estado === 'completada' || c.estado === 'cancelada',
                )}
              />
            )}
          </div>
        )}
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

interface CapGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  capacitaciones: Array<{
    id: number;
    nombre: string;
    fecha: string;
    hora_inicio: string;
    inscritos: number;
    max_participantes: number;
    estado: CapacitacionEstado;
  }>;
}

function CapGroup({ title, icon: Icon, capacitaciones }: CapGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {title}
          <Badge variant="outline" className="ml-1">
            {capacitaciones.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Hacé click en una capacitacion para ver el detalle o tomar asistencia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {capacitaciones
            .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
            .map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/capacitaciones/$id"
                      params={{ id: String(c.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {c.nombre}
                    </Link>
                    <CapacitacionStatusBadge estado={c.estado} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFechaCorta(c.fecha)} - {c.hora_inicio.slice(0, 5)} -{' '}
                    {c.inscritos} / {c.max_participantes} inscriptos
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/capacitaciones/$id"
                      params={{ id: String(c.id) }}
                    >
                      Ver detalle
                    </Link>
                  </Button>
                  {c.estado !== 'cancelada' && (
                    <Button asChild size="sm">
                      <Link
                        to="/capacitaciones/$id/asistencia"
                        params={{ id: String(c.id) }}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Tomar asistencia
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
