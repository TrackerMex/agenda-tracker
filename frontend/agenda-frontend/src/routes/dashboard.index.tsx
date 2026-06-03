import { Link, createFileRoute } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  PlusCircle,
  Users,
} from 'lucide-react';
import { ChartAreaInteractive, type DashboardChartPoint } from '@/components/chart-area-interactive';
import { CapacitacionCard } from '@/components/capacitacion/CapacitacionCard';
import { DataTable, type DashboardTableRow } from '@/components/data-table';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import { SectionCards, type SectionCardItem } from '@/components/section-cards';
import { Button } from '@/components/ui/button';
import { useAreas } from '@/hooks/useAreas';
import { useCapacitaciones, useMisCapacitaciones } from '@/hooks/useCapacitaciones';
import { useAuthStore } from '@/store/authStore';
import type { CapacitacionListItem } from '@/types';

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

function buildChartData(capacitaciones: CapacitacionListItem[]): DashboardChartPoint[] {
  const grouped = new Map<string, DashboardChartPoint>();

  for (const capacitacion of capacitaciones) {
    const current = grouped.get(capacitacion.fecha) ?? {
      date: capacitacion.fecha,
      inscripciones: 0,
      cupos: 0,
    };

    current.inscripciones += capacitacion.inscritos;
    current.cupos += Math.max(0, capacitacion.max_participantes - capacitacion.inscritos);
    grouped.set(capacitacion.fecha, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
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
  const areaMap = new Map(areas.map((a) => [a.id, a.nombre]));
  const misProximas = misCapacitaciones
    .filter((c) => c.fecha >= today && c.estado === 'programada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
    .slice(0, 5);
  const proximasActivas = proximas
    .filter((c) => c.fecha >= today && c.estado === 'programada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
  const agendaRows: DashboardTableRow[] = proximasActivas.slice(0, 12).map((c) => ({
    ...c,
    areaNombre: areaMap.get(c.area_id),
  }));

  const totalInscritas = misCapacitaciones.length;
  const completadas = misCapacitaciones.filter((c) => c.estado === 'completada').length;
  const proximasCount = misCapacitaciones.filter(
    (c) => c.fecha >= today && c.estado === 'programada',
  ).length;
  const cupoLibreTotal = proximasActivas.reduce(
    (acc, c) => acc + Math.max(0, c.max_participantes - c.inscritos),
    0,
  );
  const chartData = buildChartData(proximasActivas);
  const isLoading = misCapQuery.isLoading || proximasQuery.isLoading || areasQuery.isLoading;

  const sectionCards: SectionCardItem[] = [
    {
      icon: GraduationCap,
      label: 'Inscripciones totales',
      value: totalInscritas,
      description: 'Historial personal',
      detail: 'Capacitaciones en las que estas registrado',
      trend: totalInscritas > 0 ? `${totalInscritas}` : undefined,
      tone: 'default',
    },
    {
      icon: Clock,
      label: 'Proximas activas',
      value: proximasCount,
      description: 'Agenda inmediata',
      detail: 'Sesiones programadas para ti',
      trend: proximasCount > 0 ? `${proximasCount}` : undefined,
      tone: 'warning',
    },
    {
      icon: CheckCircle2,
      label: 'Completadas',
      value: completadas,
      description: 'Avance confirmado',
      detail: 'Capacitaciones cerradas en tu historial',
      tone: 'success',
    },
    {
      icon: Users,
      label: 'Cupos libres',
      value: cupoLibreTotal,
      description: 'Disponibilidad global',
      detail: 'Lugares abiertos en proximas sesiones',
      tone: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Hola, {user?.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de capacitaciones, cupos y pendientes de tu agenda.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm">Cargando dashboard...</span>
        </div>
      ) : (
        <>
          <SectionCards items={sectionCards} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)]">
            <ChartAreaInteractive data={chartData} />
            <DataTable data={agendaRows} />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mis proximas capacitaciones</h2>
              {misProximas.length > 0 && (
                <Button asChild variant="link" size="sm">
                  <Link to="/capacitaciones">Ver todas</Link>
                </Button>
              )}
            </div>

            {misProximas.length === 0 ? (
              <EmptyState
                title="Aun no tienes inscripciones activas"
                description="Explora la lista y registrate en las capacitaciones que te interesen."
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
                description="Explora y filtra todas las disponibles."
                icon={Calendar}
              />
              {isJefe && (
                <>
                  <QuickLink
                    to="/capacitaciones/crear"
                    title="Crear capacitacion"
                    description="Programa una nueva capacitacion para tu area."
                    icon={PlusCircle}
                  />
                  <QuickLink
                    to="/dashboard/area"
                    title="Mi area"
                    description="Gestiona personal, sesiones y asistencia."
                    icon={Users}
                  />
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

interface QuickLinkProps {
  to: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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
