import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CapacitacionForm } from '@/components/capacitacion/CapacitacionForm';
import type { CapacitacionDetalle } from '@/types';

export const Route = createFileRoute('/capacitaciones/crear')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!user?.roles?.includes('jefe_area') && !user?.roles?.includes('admin')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: CrearCapacitacionPage,
});

function CrearCapacitacionPage() {
  const navigate = useNavigate();
  const [created, setCreated] = useState<CapacitacionDetalle | null>(null);

  function handleSuccess(capacitacion: CapacitacionDetalle) {
    setCreated(capacitacion);
  }

  function handleCrearOtra() {
    setCreated(null);
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="mt-4 text-2xl">Capacitacion creada</CardTitle>
            <CardDescription>
              "{created.nombre}" quedo agendada para el {created.fecha} a las{' '}
              {created.hora_inicio.slice(0, 5)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/capacitaciones/$id" params={{ id: String(created.id) }}>
                Ver detalle
              </Link>
            </Button>
            <Button variant="outline" onClick={handleCrearOtra}>
              Crear otra
            </Button>
            <Button asChild variant="ghost">
              <Link to="/capacitaciones">Volver al listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/capacitaciones">
            <ArrowLeft className="h-4 w-4" />
            Volver a capacitaciones
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Crear capacitacion</h1>
        <p className="text-muted-foreground">
          Completa los datos para agendar una nueva capacitacion. El capacitador debe
          pertenecer al area seleccionada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la capacitacion</CardTitle>
          <CardDescription>
            Los campos marcados con <span className="text-destructive">*</span> son
            obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CapacitacionForm
            onSuccess={handleSuccess}
            onCancel={() => navigate({ to: '/capacitaciones' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
