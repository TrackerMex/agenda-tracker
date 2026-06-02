import { useMemo, useState } from 'react';
import { Check, Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import { cn } from '@/lib/utils';
import type { RegistroCapacitacion } from '@/types';

export interface AsistenciaDraft {
  asistio: boolean;
  comentarios: string;
}

export type AsistenciaDraftMap = Record<number, AsistenciaDraft>;

export interface AsistenciaListProps {
  registros: RegistroCapacitacion[];
  drafts: AsistenciaDraftMap;
  onChange: (registroId: number, draft: AsistenciaDraft) => void;
  pendingId: number | null;
  disabled?: boolean;
  isReadOnly?: boolean;
}

function formatHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function AsistenciaList({
  registros,
  drafts,
  onChange,
  pendingId,
  disabled = false,
  isReadOnly = false,
}: AsistenciaListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      [...registros].sort((a, b) => {
        const aName = a.usuario ? `${a.usuario.apellido} ${a.usuario.nombre}` : '';
        const bName = b.usuario ? `${b.usuario.apellido} ${b.usuario.nombre}` : '';
        return aName.localeCompare(bName);
      }),
    [registros],
  );

  if (registros.length === 0) {
    return (
      <EmptyState
        title="Aun no hay inscriptos"
        description="Cuando alguien se registre, lo veras aca para marcar asistencia."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <ul className="divide-y">
        {sorted.map((reg) => {
          const draft = drafts[reg.id] ?? {
            asistio: reg.asistio,
            comentarios: reg.comentarios ?? '',
          };
          const isPending = pendingId === reg.id;
          const isExpanded = expandedId === reg.id;
          const hasComentarios = draft.comentarios.trim().length > 0;
          const isDirty =
            draft.asistio !== reg.asistio ||
            (draft.comentarios ?? '') !== (reg.comentarios ?? '');

          return (
            <li
              key={reg.id}
              className={cn(
                'p-3 transition-colors sm:p-4',
                isPending && 'bg-muted/50',
                draft.asistio && !isPending && 'bg-emerald-50/30 dark:bg-emerald-950/10',
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {reg.usuario
                        ? `${reg.usuario.nombre} ${reg.usuario.apellido}`
                        : `Usuario #${reg.usuario_id}`}
                    </span>
                    {!isReadOnly && isDirty && (
                      <Badge variant="warning" className="text-[10px]">
                        Sin guardar
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {reg.usuario?.email && <span>{reg.usuario.email}</span>}
                    <span>Registrado: {formatHora(reg.registrado_en)}</span>
                  </div>
                </div>

                {!isReadOnly ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.asistio ? 'default' : 'outline'}
                      onClick={() => onChange(reg.id, { ...draft, asistio: true })}
                      disabled={disabled}
                      className={cn(
                        'gap-1',
                        draft.asistio && 'bg-emerald-600 text-white hover:bg-emerald-700',
                      )}
                      aria-pressed={draft.asistio}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Asistio
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!draft.asistio ? 'destructive' : 'outline'}
                      onClick={() => onChange(reg.id, { ...draft, asistio: false })}
                      disabled={disabled}
                      className="gap-1"
                      aria-pressed={!draft.asistio}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      No asistio
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                      disabled={disabled}
                      className="gap-1"
                      aria-expanded={isExpanded}
                      aria-controls={`comentarios-${reg.id}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {hasComentarios ? 'Editar nota' : 'Nota'}
                    </Button>
                    {isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={reg.asistio ? 'success' : 'destructive'}>
                      {reg.asistio ? 'Asistio' : 'No asistio'}
                    </Badge>
                    {reg.comentarios && (
                      <span className="text-muted-foreground line-clamp-1 max-w-xs">
                        {reg.comentarios}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!isReadOnly && isExpanded && (
                <div id={`comentarios-${reg.id}`} className="mt-3 sm:ml-1">
                  <label
                    htmlFor={`comentario-${reg.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Comentarios (opcional)
                  </label>
                  <textarea
                    id={`comentario-${reg.id}`}
                    value={draft.comentarios}
                    onChange={(e) =>
                      onChange(reg.id, { ...draft, comentarios: e.target.value })
                    }
                    placeholder="Ej: llego tarde, participo активно..."
                    rows={2}
                    disabled={disabled}
                    className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
