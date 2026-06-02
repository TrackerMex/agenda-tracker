import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { Mail, User, Building2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin, useOutlookLogin } from '@/hooks/useAuth';
import { useAreas } from '@/hooks/useAreas';
import { getErrorMessage } from '@/lib/api';
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

export type OAuthProvider = 'google' | 'outlook';

interface OAuthSimulationFormProps {
  provider: OAuthProvider;
}

const oauthSchema = z.object({
  email: z.string().email('Email invalido'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  area_id: z.coerce.number().int().positive('Selecciona un area'),
});

type OAuthFormValues = z.infer<typeof oauthSchema>;
type OAuthFormErrors = Partial<Record<keyof OAuthFormValues, string>>;

const PROVIDER_LABELS: Record<OAuthProvider, { name: string; brand: string }> = {
  google: { name: 'Google', brand: 'Google' },
  outlook: { name: 'Outlook', brand: 'Microsoft' },
};

function generateProviderId(provider: OAuthProvider): string {
  const random = Math.random().toString(36).slice(2, 12);
  const ts = Date.now().toString(36);
  const prefix = provider === 'google' ? 'g' : 'm';
  return `${prefix}_${ts}_${random}`;
}

export function OAuthSimulationForm({ provider }: OAuthSimulationFormProps) {
  const navigate = useNavigate();
  const areasQuery = useAreas();
  const googleMutation = useGoogleLogin();
  const outlookMutation = useOutlookLogin();
  const mutation = provider === 'google' ? googleMutation : outlookMutation;

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [areaId, setAreaId] = useState('');
  const [formErrors, setFormErrors] = useState<OAuthFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const providerId = useMemo(() => generateProviderId(provider), [provider]);

  function validate(): OAuthFormValues | null {
    const result = oauthSchema.safeParse({ email, nombre, apellido, area_id: areaId });
    if (result.success) {
      setFormErrors({});
      return result.data;
    }
    const errors: OAuthFormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof OAuthFormValues;
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
      await mutation.mutateAsync({
        provider_id: providerId,
        email: values.email,
        nombre: values.nombre,
        apellido: values.apellido,
        area_id: values.area_id,
      });
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, `No se pudo completar el inicio de sesion con ${PROVIDER_LABELS[provider].name}`),
      );
    }
  }

  const areas = areasQuery.data ?? [];
  const areasLoading = areasQuery.isLoading;
  const isSubmitting = mutation.isPending;
  const label = PROVIDER_LABELS[provider];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Continuar con {label.name}</CardTitle>
          </div>
          <CardDescription>
            Simulacion de callback OAuth. En produccion, los datos del perfil llegan automaticamente
            desde {label.brand}. Aqui los ingresas manualmente para probar el flujo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Modo simulacion (F06)</AlertTitle>
              <AlertDescription>
                <code className="text-xs">provider_id</code> generado automaticamente:{' '}
                <code className="break-all text-xs">{providerId}</code>
              </AlertDescription>
            </Alert>

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
              {isSubmitting ? 'Conectando...' : `Continuar con ${label.name}`}
            </Button>

            <div className="flex w-full items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => void navigate({ to: '/login' })}
                className="text-muted-foreground hover:text-foreground hover:underline"
                disabled={isSubmitting}
              >
                Volver a login
              </button>
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Crear cuenta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
