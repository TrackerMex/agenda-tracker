import { Link, createFileRoute, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Mail,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCapacitacion,
  useDesregistrarmeDeCapacitacion,
  useMisCapacitaciones,
  useRegistrarmeACapacitacion,
} from '@/hooks/useCapacitaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CapacitacionStatusBadge } from '@/components/capacitacion/CapacitacionStatusBadge';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/capacitaciones/$id/')({
  component: CapacitacionDetailPage,
});

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} minutos`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} hora${h === 1 ? '' : 's'}`;
  return `${h} h ${m} min`;
}

function CapacitacionDetailPage() {
  const params = useParams({ from: '/capacitaciones/$id/' });
  const capacitacionId = Number(params.id);
  const isValidId = Number.isFinite(capacitacionId) && capacitacionId > 0;
  const user = useAuthStore((s) => s.user);
  const canManageAttendance =
    user?.roles?.includes('jefe_area') || user?.roles?.includes('admin') || false;

  const detailQuery = useCapacitacion(isValidId ? capacitacionId : 0);
  const misQuery = useMisCapacitaciones();
  const registerMutation = useRegistrarmeACapacitacion();
  const unregisterMutation = useDesregistrarmeDeCapacitacion();

  const capacitacion = detailQuery.data;
  const misCapacitaciones = misQuery.data ?? [];
  const isRegistered = misCapacitaciones.some((c) => c.id === capacitacionId);
  const cuposLibres = capacitacion
    ? Math.max(0, capacitacion.max_participantes - capacitacion.inscritos)
    : 0;
  const isFull = cuposLibres === 0;
  const isCancelled = capacitacion?.estado === 'cancelada';

  const isMutating = registerMutation.isPending || unregisterMutation.isPending;

  async function handleRegister(): Promise<void> {
    if (!capacitacion) return;
    try {
      await registerMutation.mutateAsync(capacitacion.id);
    } catch (error) {
      window.alert(getErrorMessage(error, 'No se pudo registrarte a la capacitacion'));
    }
  }

  async function handleUnregister(): Promise<void> {
    if (!capacitacion) return;
    const confirmacion = window.confirm(
      '¿Estas seguro de que queres desinscribirte de esta capacitacion?',
    );
    if (!confirmacion) return;
    try {
      await unregisterMutation.mutateAsync(capacitacion.id);
    } catch (error) {
      window.alert(getErrorMessage(error, 'No se pudo desinscribirte de la capacitacion'));
    }
  }

  if (!isValidId) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        ID de capacitacion invalido.
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="ml-2 text-sm">Cargando detalle...</span>
      </div>
    );
  }

  if (detailQuery.isError || !capacitacion) {
    return (
      <div className="space-y-4 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/capacitaciones">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
        <EmptyState
          title="Capacitacion no encontrada"
          description="La capacitacion que buscas no existe o fue eliminada."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/capacitaciones">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a la lista
        </Link>
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold leading-tight">{capacitacion.nombre}</h1>
            {capacitacion.area && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {capacitacion.area.nombre}
              </p>
            )}
          </div>
          <CapacitacionStatusBadge estado={capacitacion.estado} />
        </div>

        {capacitacion.descripcion && (
          <p className="max-w-3xl text-sm text-muted-foreground">{capacitacion.descripcion}</p>
        )}
      </header>

      {(registerMutation.isError || unregisterMutation.isError) && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo completar la operacion</AlertTitle>
          <AlertDescription>
            {getErrorMessage(
              registerMutation.error || unregisterMutation.error,
              'Intenta nuevamente',
            )}
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell
          icon={Calendar}
          label="Fecha"
          value={formatFecha(capacitacion.fecha)}
        />
        <InfoCell
          icon={Clock}
          label="Horario"
          value={`${formatHora(capacitacion.hora_inicio)} (${formatDuration(capacitacion.duracion_minutos)})`}
        />
        <InfoCell
          icon={Globe}
          label="Plataforma"
          value={capacitacion.plataforma}
        />
        <InfoCell
          icon={Users}
          label="Inscriptos"
          value={`${capacitacion.inscritos} / ${capacitacion.max_participantes}`}
        />
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">Capacitador</h2>
        {capacitacion.capacitador ? (
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4">
            <div>
              <div className="font-medium">
                {capacitacion.capacitador.nombre} {capacitacion.capacitador.apellido}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <a
                  href={`mailto:${capacitacion.capacitador.email}`}
                  className="hover:underline"
                >
                  {capacitacion.capacitador.email}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin informacion del capacitador.</p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Inscriptos</h2>
          <Badge variant="outline">
            {capacitacion.inscritos} / {capacitacion.max_participantes}
          </Badge>
        </div>
        {capacitacion.registros && capacitacion.registros.length > 0 ? (
          <ul className="divide-y">
            {capacitacion.registros.map((reg) => (
              <li
                key={reg.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>
                  {reg.usuario
                    ? `${reg.usuario.nombre} ${reg.usuario.apellido}`
                    : `Usuario #${reg.usuario_id}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {reg.asistio ? 'Asistio' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aun no hay inscriptos.</p>
        )}
      </section>

      {!isCancelled && (
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border md:bg-card md:px-5">
          <div className="text-sm text-muted-foreground">
            {isRegistered
              ? 'Estas inscripto en esta capacitacion.'
              : isFull
                ? 'La capacitacion esta completa.'
                : `Quedan ${cuposLibres} cupo${cuposLibres === 1 ? '' : 's'} disponible${cuposLibres === 1 ? '' : 's'}.`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageAttendance && (
              <Button asChild variant="outline">
                <Link
                  to="/capacitaciones/$id/asistencia"
                  params={{ id: String(capacitacion.id) }}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Tomar asistencia
                </Link>
              </Button>
            )}
            {isRegistered ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleUnregister()}
                disabled={isMutating}
              >
                {unregisterMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Desinscribirme
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleRegister()}
                disabled={isMutating || isFull}
              >
                {registerMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {isFull ? 'Completa' : 'Registrarme'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoCellProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InfoCell({ icon: Icon, label, value }: InfoCellProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className={cn('mt-1 text-sm font-medium')}>{value}</div>
    </div>
  );
}
