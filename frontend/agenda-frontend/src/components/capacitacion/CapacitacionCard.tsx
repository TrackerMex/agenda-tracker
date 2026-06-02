import { Calendar, Clock, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CapacitacionStatusBadge } from './CapacitacionStatusBadge';
import type { CapacitacionListItem } from '@/types';

export interface CapacitacionCardProps {
  capacitacion: CapacitacionListItem;
  showAreaName?: boolean;
  areaNombre?: string;
  showActions?: boolean;
  showRegisterButton?: boolean;
  isRegistered?: boolean;
  onRegister?: (id: number) => void;
  onUnregister?: (id: number) => void;
  isMutating?: boolean;
}

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) return fecha;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function CapacitacionCard({
  capacitacion,
  showAreaName = true,
  areaNombre,
  showActions = true,
  showRegisterButton = false,
  isRegistered = false,
  onRegister,
  onUnregister,
  isMutating = false,
}: CapacitacionCardProps) {
  const cuposLibres = Math.max(0, capacitacion.max_participantes - capacitacion.inscritos);
  const isFull = cuposLibres === 0;
  const isCancelled = capacitacion.estado === 'cancelada';

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <header className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">
            {capacitacion.nombre}
          </h3>
          {showAreaName && areaNombre && (
            <p className="text-xs text-muted-foreground">{areaNombre}</p>
          )}
        </div>
        <CapacitacionStatusBadge estado={capacitacion.estado} />
      </header>

      {capacitacion.descripcion && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {capacitacion.descripcion}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatFecha(capacitacion.fecha)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {formatHora(capacitacion.hora_inicio)} · {formatDuration(capacitacion.duracion_minutos)}
          </span>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {capacitacion.inscritos} / {capacitacion.max_participantes} inscriptos
          </span>
          {!isFull && !isCancelled && (
            <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
              {cuposLibres} libre{cuposLibres === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      </dl>

      {showActions && (
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              to="/capacitaciones/$id"
              params={{ id: String(capacitacion.id) }}
            >
              Ver detalle
            </Link>
          </Button>
          {showRegisterButton && !isCancelled && (
            isRegistered ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUnregister?.(capacitacion.id)}
                disabled={isMutating}
              >
                Desregistrarme
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => onRegister?.(capacitacion.id)}
                disabled={isMutating || isFull}
              >
                {isFull ? 'Completa' : 'Registrarme'}
              </Button>
            )
          )}
        </div>
      )}
    </article>
  );
}
