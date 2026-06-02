import { useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Hash,
  Link2,
  Loader2,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SelectArea } from '@/components/capacitacion/SelectArea';
import { SelectCapacitador } from '@/components/capacitacion/SelectCapacitador';
import { useCreateCapacitacion } from '@/hooks/useCapacitaciones';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import type { CapacitacionCreatePayload, CapacitacionDetalle } from '@/types';

export interface CapacitacionFormProps {
  onSuccess?: (capacitacion: CapacitacionDetalle) => void;
  onCancel?: () => void;
}

type FormValues = {
  nombre: string;
  descripcion: string;
  area_id: number | null;
  capacitador_id: number | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  plataforma: string;
  max_participantes: number;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const capacitacionSchema = z.object({
  nombre: z
    .string()
    .min(5, 'Minimo 5 caracteres')
    .max(255, 'Maximo 255 caracteres'),
  descripcion: z
    .string()
    .max(2000, 'Maximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
  area_id: z.coerce.number().int().positive('Selecciona un area'),
  capacitador_id: z.coerce
    .number()
    .int()
    .positive('Selecciona un capacitador del area'),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida')
    .refine((value) => value >= todayIso(), {
      message: 'La fecha debe ser hoy o posterior',
    }),
  hora_inicio: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora invalida'),
  duracion_minutos: z.coerce
    .number()
    .int()
    .positive('La duracion debe ser mayor a 0')
    .max(600, 'La duracion maxima es 600 minutos (10 horas)'),
  plataforma: z
    .string()
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  max_participantes: z.coerce
    .number()
    .int()
    .min(5, 'Minimo 5 participantes')
    .max(500, 'Maximo 500 participantes'),
});

export function CapacitacionForm({ onSuccess, onCancel }: CapacitacionFormProps) {
  const user = useAuthStore((s) => s.user);
  const initialAreaId = useMemo(() => user?.area_id ?? null, [user?.area_id]);

  const [values, setValues] = useState<FormValues>({
    nombre: '',
    descripcion: '',
    area_id: initialAreaId,
    capacitador_id: null,
    fecha: '',
    hora_inicio: '',
    duracion_minutos: 60,
    plataforma: 'Google Meet',
    max_participantes: 20,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateCapacitacion();

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleAreaChange(next: number | null) {
    setValues((prev) => {
      if (prev.area_id === next) {
        return prev;
      }
      return { ...prev, area_id: next, capacitador_id: null };
    });
    setErrors((prev) => {
      const next2 = { ...prev };
      delete next2.area_id;
      delete next2.capacitador_id;
      return next2;
    });
  }

  function handleCapacitadorChange(next: number | null) {
    setField('capacitador_id', next);
  }

  function validate(): CapacitacionCreatePayload | null {
    const result = capacitacionSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return {
        nombre: result.data.nombre,
        descripcion: result.data.descripcion || undefined,
        area_id: result.data.area_id,
        capacitador_id: result.data.capacitador_id,
        fecha: result.data.fecha,
        hora_inicio: result.data.hora_inicio,
        duracion_minutos: result.data.duracion_minutos,
        plataforma: result.data.plataforma,
        max_participantes: result.data.max_participantes,
      };
    }

    const fieldErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FormValues;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    setErrors(fieldErrors);
    setSubmitError(null);
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    const payload = validate();
    if (!payload) {
      return;
    }

    try {
      const created = await createMutation.mutateAsync(payload);
      onSuccess?.(created);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        const mapped: FormErrors = {};
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          if (msgs && msgs[0]) {
            mapped[key as keyof FormValues] = msgs[0];
          }
        }
        setErrors(mapped);
        return;
      }
      setSubmitError(getErrorMessage(error, 'No se pudo crear la capacitacion'));
    }
  }

  const isSubmitting = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nombre">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <FileText
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="nombre"
              placeholder="Ej: Introduccion a TypeScript avanzado"
              value={values.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              className="pl-9"
              aria-invalid={Boolean(errors.nombre)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descripcion">Descripcion</Label>
          <textarea
            id="descripcion"
            placeholder="Objetivos, temario, requisitos previos..."
            value={values.descripcion}
            onChange={(e) => setField('descripcion', e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.descripcion && (
            <p className="text-sm text-destructive">{errors.descripcion}</p>
          )}
        </div>

        <SelectArea
          value={values.area_id}
          onChange={handleAreaChange}
          error={errors.area_id}
          disabled={isSubmitting}
        />

        <SelectCapacitador
          areaId={values.area_id}
          value={values.capacitador_id}
          onChange={handleCapacitadorChange}
          error={errors.capacitador_id}
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="fecha"
              type="date"
              min={todayIso()}
              value={values.fecha}
              onChange={(e) => setField('fecha', e.target.value)}
              className="pl-9"
              aria-invalid={Boolean(errors.fecha)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.fecha && (
            <p className="text-sm text-destructive">{errors.fecha}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_inicio">
            Hora de inicio <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Clock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="hora_inicio"
              type="time"
              value={values.hora_inicio}
              onChange={(e) => setField('hora_inicio', e.target.value)}
              className="pl-9"
              aria-invalid={Boolean(errors.hora_inicio)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.hora_inicio && (
            <p className="text-sm text-destructive">{errors.hora_inicio}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracion_minutos">
            Duracion (minutos) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Hash
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="duracion_minutos"
              type="number"
              min={5}
              max={600}
              step={5}
              value={values.duracion_minutos}
              onChange={(e) =>
                setField('duracion_minutos', Number(e.target.value))
              }
              className="pl-9"
              aria-invalid={Boolean(errors.duracion_minutos)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.duracion_minutos && (
            <p className="text-sm text-destructive">{errors.duracion_minutos}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_participantes">
            Max. participantes <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Users
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="max_participantes"
              type="number"
              min={5}
              max={500}
              step={1}
              value={values.max_participantes}
              onChange={(e) =>
                setField('max_participantes', Number(e.target.value))
              }
              className="pl-9"
              aria-invalid={Boolean(errors.max_participantes)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.max_participantes && (
            <p className="text-sm text-destructive">{errors.max_participantes}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="plataforma">
            Plataforma <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="plataforma"
              placeholder="Google Meet, Zoom, Microsoft Teams, Presencial..."
              value={values.plataforma}
              onChange={(e) => setField('plataforma', e.target.value)}
              className="pl-9"
              aria-invalid={Boolean(errors.plataforma)}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.plataforma && (
            <p className="text-sm text-destructive">{errors.plataforma}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creando...' : 'Crear capacitacion'}
        </Button>
      </div>
    </form>
  );
}
