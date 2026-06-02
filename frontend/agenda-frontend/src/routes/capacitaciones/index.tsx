import { useMemo, useState } from 'react';
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import { Calendar, PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCapacitaciones } from '@/hooks/useCapacitaciones';
import { useAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { CapacitacionCard } from '@/components/capacitacion/CapacitacionCard';
import {
  CapacitacionFilters,
  type CapacitacionFiltersState,
} from '@/components/capacitacion/CapacitacionFilters';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import { Loader2 } from 'lucide-react';
import type { CapacitacionFiltros } from '@/types';

export const Route = createFileRoute('/capacitaciones/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: CapacitacionesListPage,
});

const INITIAL_FILTERS: CapacitacionFiltersState = {
  busqueda: '',
  area_id: '',
  estado: '',
};

function CapacitacionesListPage() {
  const isJefe = useAuthStore((s) => s.esJefe());
  const [filters, setFilters] = useState<CapacitacionFiltersState>(INITIAL_FILTERS);

  const serverFiltros: CapacitacionFiltros = useMemo(() => {
    const out: CapacitacionFiltros = {};
    if (filters.area_id) out.area_id = Number(filters.area_id);
    if (filters.estado) out.estado = filters.estado;
    return out;
  }, [filters.area_id, filters.estado]);

  const areasQuery = useAreas();
  const capacitacionesQuery = useCapacitaciones(serverFiltros);

  const areas = areasQuery.data ?? [];
  const capacitaciones = capacitacionesQuery.data ?? [];
  const areaMap = new Map(areas.map((a) => [a.id, a.nombre]));

  const filtered = useMemo(() => {
    const q = filters.busqueda.trim().toLowerCase();
    if (!q) return capacitaciones;
    return capacitaciones.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion ?? '').toLowerCase().includes(q),
    );
  }, [capacitaciones, filters.busqueda]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Capacitaciones</h1>
          <p className="text-sm text-muted-foreground">
            Explora todas las capacitaciones disponibles en la plataforma.
          </p>
        </div>
        {isJefe && (
          <Button asChild>
            <Link to="/capacitaciones/crear">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Crear capacitacion
            </Link>
          </Button>
        )}
      </header>

      <CapacitacionFilters
        value={filters}
        onChange={setFilters}
        areas={areas}
        disabled={capacitacionesQuery.isFetching}
      />

      {capacitacionesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm">Cargando capacitaciones...</span>
        </div>
      ) : capacitacionesQuery.isError ? (
        <EmptyState
          title="No se pudieron cargar las capacitaciones"
          description="Intenta recargar la pagina o vuelve mas tarde."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={
            filters.busqueda || filters.area_id || filters.estado
              ? 'No hay capacitaciones que coincidan con los filtros aplicados.'
              : 'Todavia no hay capacitaciones programadas en la plataforma.'
          }
          icon={Calendar}
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Mostrando {filtered.length} de {capacitaciones.length} capacitacion
            {capacitaciones.length === 1 ? '' : 'es'}
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <CapacitacionCard
                key={c.id}
                capacitacion={c}
                areaNombre={areaMap.get(c.area_id)}
                showRegisterButton={false}
                showActions
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
