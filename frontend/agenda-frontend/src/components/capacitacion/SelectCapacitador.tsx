import { useMemo } from 'react';
import { GraduationCap, UserCheck, Users } from 'lucide-react';
import { usePersonalArea } from '@/hooks/useAreas';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PersonalArea, RolNombre } from '@/types';

export interface SelectCapacitadorProps {
  areaId: number | null;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CAPACITADOR_ROLES: RolNombre[] = ['capacitador', 'jefe_area', 'admin'];

function pickCapacitadores(personal: PersonalArea[]): PersonalArea[] {
  return personal.filter((persona) =>
    persona.roles.some((rol) => CAPACITADOR_ROLES.includes(rol)),
  );
}

export function SelectCapacitador({
  areaId,
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  id = 'capacitador',
  label = 'Capacitador',
  placeholder = 'Selecciona un capacitador',
  className,
}: SelectCapacitadorProps) {
  const personalQuery = usePersonalArea(areaId);
  const personal = personalQuery.data ?? [];

  const capacitadores = useMemo(() => pickCapacitadores(personal), [personal]);

  const isAreaMissing = areaId === null;
  const isLoading = personalQuery.isLoading;
  const isError = personalQuery.isError;
  const isDisabled = disabled || isAreaMissing || isLoading;

  const selectedId = value === null ? '' : String(value);
  const selectedInList = capacitadores.some((c) => c.id === value);

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <GraduationCap
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <select
          id={id}
          value={selectedId}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={isDisabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={isError ? `${id}-error` : undefined}
          className={cn(
            'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
        >
          <option value="">
            {isAreaMissing
              ? 'Selecciona un area primero'
              : isLoading
                ? 'Cargando personal...'
                : capacitadores.length === 0
                  ? 'No hay capacitadores disponibles en el area'
                  : placeholder}
          </option>
          {capacitadores.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombre} {persona.apellido}
              {persona.roles.includes('admin')
                ? ' (admin)'
                : persona.roles.includes('jefe_area')
                  ? ' (jefe)'
                  : ''}
            </option>
          ))}
        </select>
      </div>

      {!isAreaMissing && !isLoading && capacitadores.length === 0 && (
        <p
          id={`${id}-hint`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Esta area no tiene usuarios con rol capacitador, jefe o admin. Pedile a un
          administrador que asigne un rol.
        </p>
      )}

      {!isAreaMissing && selectedInList && (
        <p
          className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
          aria-live="polite"
        >
          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {capacitadores.find((c) => c.id === value)?.email}
        </p>
      )}

      {isError && (
        <p
          id={`${id}-error`}
          className="text-sm text-destructive"
          role="alert"
        >
          No se pudo cargar el personal del area
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
