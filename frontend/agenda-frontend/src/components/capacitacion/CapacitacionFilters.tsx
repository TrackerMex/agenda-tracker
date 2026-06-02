import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Area, CapacitacionEstado } from '@/types';

export interface CapacitacionFiltersState {
  busqueda: string;
  area_id: string;
  estado: '' | CapacitacionEstado;
}

export interface CapacitacionFiltersProps {
  value: CapacitacionFiltersState;
  onChange: (next: CapacitacionFiltersState) => void;
  areas: Area[];
  disabled?: boolean;
}

const ESTADOS: Array<{ value: '' | CapacitacionEstado; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'programada', label: 'Programada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function CapacitacionFilters({ value, onChange, areas, disabled = false }: CapacitacionFiltersProps) {
  function update<K extends keyof CapacitacionFiltersState>(key: K, next: CapacitacionFiltersState[K]) {
    onChange({ ...value, [key]: next });
  }

  function clearAll() {
    onChange({ busqueda: '', area_id: '', estado: '' });
  }

  const hasFilters = Boolean(value.busqueda || value.area_id || value.estado);

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_200px_200px_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-busqueda" className="sr-only">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filtro-busqueda"
            type="search"
            placeholder="Buscar por nombre..."
            value={value.busqueda}
            onChange={(e) => update('busqueda', e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-area" className="sr-only">
          Area
        </Label>
        <select
          id="filtro-area"
          value={value.area_id}
          onChange={(e) => update('area_id', e.target.value)}
          className="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          <option value="">Todas las areas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-estado" className="sr-only">
          Estado
        </Label>
        <select
          id="filtro-estado"
          value={value.estado}
          onChange={(e) => update('estado', e.target.value as CapacitacionFiltersState['estado'])}
          className="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          {ESTADOS.map((e) => (
            <option key={e.value || 'all'} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={disabled || !hasFilters}
          className="w-full"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
