import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CapacitacionEstado } from '@/types';

const CONFIG: Record<
  CapacitacionEstado,
  { label: string; variant: 'success' | 'warning' | 'destructive'; icon: React.ComponentType<{ className?: string }> }
> = {
  programada: { label: 'Programada', variant: 'warning', icon: Clock },
  completada: { label: 'Completada', variant: 'success', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', variant: 'destructive', icon: XCircle },
};

export interface CapacitacionStatusBadgeProps {
  estado: CapacitacionEstado;
}

export function CapacitacionStatusBadge({ estado }: CapacitacionStatusBadgeProps) {
  const cfg = CONFIG[estado];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {cfg.label}
    </Badge>
  );
}
