import { createFileRoute, Link, redirect, useParams } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Users,
  XCircle,
} from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCapacitacion,
  useMarcarAsistencia,
} from '@/hooks/useCapacitaciones';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CapacitacionStatusBadge } from '@/components/capacitacion/CapacitacionStatusBadge';
import {
  AsistenciaList,
  type AsistenciaDraft,
  type AsistenciaDraftMap,
} from '@/components/capacitacion/AsistenciaList';
import { getErrorMessage } from '@/lib/api';
import type { RegistroCapacitacion } from '@/types';

export const Route = createFileRoute('/capacitaciones/$id/asistencia')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!user?.roles?.includes('jefe_area') && !user?.roles?.includes('admin')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: AsistenciaPage,
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

function AsistenciaPage() {
  const params = useParams({ from: '/capacitaciones/$id/asistencia' });
  const capacitacionId = Number(params.id);
  const isValidId = Number.isFinite(capacitacionId) && capacitacionId > 0;

  const detailQuery = useCapacitacion(isValidId ? capacitacionId : 0);
  const asistenciaMutation = useMarcarAsistencia();

  const [drafts, setDrafts] = useState<AsistenciaDraftMap>({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; ok: boolean; msg: string } | null>(
    null,
  );

  const registros: RegistroCapacitacion[] = detailQuery.data?.registros ?? [];

  useEffect(() => {
    const map: AsistenciaDraftMap = {};
    for (const reg of registros) {
      map[reg.id] = {
        asistio: reg.asistio,
        comentarios: reg.comentarios ?? '',
      };
    }
    setDrafts(map);
  }, [registros]);

  const handleChange = useCallback(
    (registroId: number, draft: AsistenciaDraft) => {
      setDrafts((prev) => ({ ...prev, [registroId]: draft }));
      setFeedback(null);
    },
    [],
  );

  const handleSave = useCallback(
    async (registro: RegistroCapacitacion) => {
      const draft = drafts[registro.id];
      if (!draft) return;

      const original = {
        asistio: registro.asistio,
        comentarios: registro.comentarios ?? '',
      };
      if (
        draft.asistio === original.asistio &&
        draft.comentarios.trim() === original.comentarios.trim()
      ) {
        setFeedback({
          id: registro.id,
          ok: false,
          msg: 'No hay cambios para guardar.',
        });
        return;
      }

      setPendingId(registro.id);
      setFeedback(null);
      try {
        await asistenciaMutation.mutateAsync({
          capacitacionId: registro.capacitacion_id,
          usuarioId: registro.usuario_id,
          payload: {
            asistio: draft.asistio,
            comentarios: draft.comentarios.trim() || undefined,
          },
        });
        setFeedback({
          id: registro.id,
          ok: true,
          msg: `Asistencia de ${registro.usuario?.nombre ?? 'usuario'} guardada.`,
        });
      } catch (error) {
        setFeedback({
          id: registro.id,
          ok: false,
          msg: getErrorMessage(error, 'No se pudo guardar la asistencia'),
        });
      } finally {
        setPendingId(null);
      }
    },
    [asistenciaMutation, drafts],
  );

  const handleSaveAll = useCallback(async () => {
    if (registros.length === 0) return;
    setFeedback(null);
    let saved = 0;
    for (const reg of registros) {
      const draft = drafts[reg.id];
      if (!draft) continue;
      const isDirty =
        draft.asistio !== reg.asistio ||
        (draft.comentarios ?? '').trim() !== (reg.comentarios ?? '').trim();
      if (!isDirty) continue;
      setPendingId(reg.id);
      try {
        await asistenciaMutation.mutateAsync({
          capacitacionId: reg.capacitacion_id,
          usuarioId: reg.usuario_id,
          payload: {
            asistio: draft.asistio,
            comentarios: draft.comentarios.trim() || undefined,
          },
        });
        saved += 1;
      } catch (error) {
        setFeedback({
          id: reg.id,
          ok: false,
          msg: getErrorMessage(error, 'Error al guardar'),
        });
        setPendingId(null);
        return;
      }
      setPendingId(null);
    }
    setFeedback({
      id: 0,
      ok: true,
      msg:
        saved === 0
          ? 'No hay cambios pendientes.'
          : `Se guardaron ${saved} actualizacion${saved === 1 ? '' : 'es'}.`,
    });
  }, [asistenciaMutation, drafts, registros]);

  const stats = useMemo(() => {
    const total = registros.length;
    let asistio = 0;
    let pendiente = 0;
    for (const reg of registros) {
      const draft = drafts[reg.id];
      if (draft ? draft.asistio : reg.asistio) asistio += 1;
      else pendiente += 1;
    }
    return { total, asistio, pendiente };
  }, [drafts, registros]);

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
        <span className="ml-2 text-sm">Cargando capacitacion...</span>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-4 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/area">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a mi area
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar la capacitacion</AlertTitle>
          <AlertDescription>
            Verifica que exista y que pertenezca a tu area.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const cap = detailQuery.data;
  const isCancelled = cap.estado === 'cancelada';
  const dirtyCount = registros.filter((reg) => {
    const draft = drafts[reg.id];
    if (!draft) return false;
    return (
      draft.asistio !== reg.asistio ||
      (draft.comentarios ?? '').trim() !== (reg.comentarios ?? '').trim()
    );
  }).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link
          to="/capacitaciones/$id"
          params={{ id: String(cap.id) }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al detalle
        </Link>
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold leading-tight">Tomar asistencia</h1>
            <p className="text-base font-medium text-muted-foreground">{cap.nombre}</p>
          </div>
          <CapacitacionStatusBadge estado={cap.estado} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatFecha(cap.fecha)} - {formatHora(cap.hora_inicio)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {cap.inscritos} inscripto{cap.inscritos === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {isCancelled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Capacitacion cancelada</AlertTitle>
          <AlertDescription>
            No se puede tomar asistencia porque la capacitacion esta cancelada.
          </AlertDescription>
        </Alert>
      )}

      {!isCancelled && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Asistieron</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.asistio}
                  </div>
                </div>
                <CheckCircle2
                  className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Pendientes</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.pendiente}
                  </div>
                </div>
                <XCircle
                  className="h-5 w-5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
              </CardContent>
            </Card>
          </section>

          {feedback && (
            <Alert variant={feedback.ok ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {feedback.ok ? 'Listo' : 'Atencion'}
              </AlertTitle>
              <AlertDescription>{feedback.msg}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Inscriptos</CardTitle>
                  <CardDescription>
                    Marca quien asistio y guarda los cambios individualmente o todos a la vez.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSaveAll()}
                  disabled={asistenciaMutation.isPending || dirtyCount === 0}
                  size="sm"
                >
                  {asistenciaMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  Guardar todo
                  {dirtyCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {dirtyCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AsistenciaList
                registros={registros}
                drafts={drafts}
                onChange={handleChange}
                pendingId={pendingId}
                disabled={asistenciaMutation.isPending}
              />
              {registros.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3">
                  {registros.map((reg) => {
                    const draft = drafts[reg.id];
                    const isDirty =
                      draft &&
                      (draft.asistio !== reg.asistio ||
                        (draft.comentarios ?? '').trim() !==
                          (reg.comentarios ?? '').trim());
                    return (
                      <Button
                        key={reg.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleSave(reg)}
                        disabled={
                          asistenciaMutation.isPending ||
                          !isDirty ||
                          pendingId === reg.id
                        }
                      >
                        {pendingId === reg.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Save className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {reg.usuario?.apellido ?? `#${reg.usuario_id}`}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
