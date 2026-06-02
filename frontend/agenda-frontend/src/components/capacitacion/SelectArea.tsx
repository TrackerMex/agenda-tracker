import { Building2 } from 'lucide-react';
import { useAreas } from '@/hooks/useAreas';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SelectAreaOption {
  id: number;
  nombre: string;
}

export interface SelectAreaProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: string;
  className?: string;
}

export function SelectArea({
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  id = 'area',
  label = 'Area',
  className,
}: SelectAreaProps) {
  const areasQuery = useAreas();
  const areas = areasQuery.data ?? [];
  const isLoading = areasQuery.isLoading;
  const isDisabled = disabled || isLoading;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Building2
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <select
          id={id}
          value={value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={isDisabled}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(
            'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
        >
          <option value="">
            {isLoading ? 'Cargando areas...' : 'Selecciona un area'}
          </option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
