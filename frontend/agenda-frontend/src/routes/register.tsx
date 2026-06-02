import { useState, type FormEvent } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { Mail, Lock, User, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRegister } from '@/hooks/useAuth';
import { useAreas } from '@/hooks/useAreas';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  area_id: z.coerce.number().int().positive('Selecciona un area'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [areaId, setAreaId] = useState('');
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const areasQuery = useAreas();
  const registerMutation = useRegister();

  function validate(): RegisterFormValues | null {
    const result = registerSchema.safeParse({ email, password, nombre, apellido, area_id: areaId });
    if (result.success) {
      setFormErrors({});
      return result.data;
    }
    const errors: RegisterFormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof RegisterFormValues;
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    setFormErrors(errors);
    setSubmitError(null);
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    const values = validate();
    if (!values) {
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        nombre: values.nombre,
        apellido: values.apellido,
        area_id: values.area_id,
      });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        const mapped: RegisterFormErrors = {};
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          if (msgs && msgs[0]) {
            mapped[key as keyof RegisterFormValues] = msgs[0];
          }
        }
        setFormErrors(mapped);
        return;
      }
      setSubmitError(getErrorMessage(error, 'No se pudo crear la cuenta'));
    }
  }

  const isSubmitting = registerMutation.isPending;
  const areas = areasQuery.data ?? [];
  const areasLoading = areasQuery.isLoading;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>
            Completa el formulario para registrarte en la plataforma.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nombre"
                    autoComplete="given-name"
                    placeholder="Maria"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="pl-9"
                    aria-invalid={Boolean(formErrors.nombre)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {formErrors.nombre && (
                  <p className="text-sm text-destructive">{formErrors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  autoComplete="family-name"
                  placeholder="Garcia"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  aria-invalid={Boolean(formErrors.apellido)}
                  disabled={isSubmitting}
                  required
                />
                {formErrors.apellido && (
                  <p className="text-sm text-destructive">{formErrors.apellido}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  aria-invalid={Boolean(formErrors.email)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  aria-invalid={Boolean(formErrors.password)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="area"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={Boolean(formErrors.area_id)}
                  disabled={isSubmitting || areasLoading}
                  required
                >
                  <option value="">
                    {areasLoading ? 'Cargando areas...' : 'Selecciona tu area'}
                  </option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.area_id && (
                <p className="text-sm text-destructive">{formErrors.area_id}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || areasLoading}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ya tenes cuenta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Iniciar sesion
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
