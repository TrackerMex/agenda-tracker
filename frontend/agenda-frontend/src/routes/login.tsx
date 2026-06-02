import { useState, type FormEvent } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogin } from '@/hooks/useAuth';
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

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginMutation = useLogin();

  function validate(): LoginFormValues | null {
    const result = loginSchema.safeParse({ email, password });
    if (result.success) {
      setFormErrors({});
      return result.data;
    }
    const errors: LoginFormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof LoginFormValues;
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
      await loginMutation.mutateAsync({ email: values.email, password: values.password });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        const mapped: LoginFormErrors = {};
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          if (msgs && msgs[0]) {
            mapped[key as keyof LoginFormValues] = msgs[0];
          }
        }
        setFormErrors(mapped);
        return;
      }
      setSubmitError(getErrorMessage(error, 'No se pudo iniciar sesion'));
    }
  }

  const isSubmitting = loginMutation.isPending;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar sesion</CardTitle>
          <CardDescription>
            Ingresa tu email y contrasena para acceder a la plataforma.
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
                  autoComplete="current-password"
                  placeholder="********"
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o continuar con</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2">
              <Button asChild type="button" variant="outline" disabled={isSubmitting}>
                <Link to="/auth/google-callback">Google</Link>
              </Button>
              <Button asChild type="button" variant="outline" disabled={isSubmitting}>
                <Link to="/auth/outlook-callback">Outlook</Link>
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              No tenes cuenta?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Registrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
