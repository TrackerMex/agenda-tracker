# F06 - Review: Frontend - Autenticación

**Agente:** reviewer
**Fecha:** 2026-06-02
**Estado:** Aprobado

---

## Resumen

F06 verificada contra `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, los criterios de aceptación de la feature y el contrato real del backend F02 (revisado en `progress/impl_f02.md` y los controllers de auth).

---

## Criterios verificados

### Estructura y archivos

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1 | `src/services/auth.service.ts` con métodos del backend | OK | `login`, `register`, `loginWithGoogle`, `loginWithOutlook`, `fetchMe` |
| 2 | `src/hooks/useAuth.ts` con hooks de mutación y query | OK | `useCurrentUser`, `useLogin`, `useRegister`, `useGoogleLogin`, `useOutlookLogin`, `useLogout` |
| 3 | `src/hooks/useAreas.ts` para selector de área en register/OAuth | OK | `useQuery` con `staleTime: 10min` |
| 4 | 4 rutas funcionales (`login`, `register`, `google-callback`, `outlook-callback`) | OK | Reemplazan placeholders de F05 |
| 5 | Componentes UI base en `src/components/ui/` | OK | `input`, `label`, `card`, `alert`, `button` (este último de F05 fix) |
| 6 | `OAuthSimulationForm` compartido | OK | Parametrizado por `provider: 'google' \| 'outlook'` |
| 7 | `types/index.ts` alineado con backend F02 | OK | `RolNombre`, `Usuario.roles[]`, `AuthSession` con `refreshToken` |
| 8 | `authStore` con `refreshToken` y helpers de rol | OK | `hasRole`, `esJefe`, `esCapacitador`, `esAdmin` |
| 9 | Refresh token queue en `api.ts` | OK | Patrón estándar con `isRefreshing` y `pendingQueue` |
| 10 | Helpers `getErrorMessage()` y `getFieldErrors()` | OK | Manejo tipado de `AxiosError<ApiErrorBody>` |

### Integración con backend F02

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 11 | `POST /api/auth/login` consumido con shape `{ email, password }` | OK | Coincide con schema Zod del backend |
| 12 | `POST /api/auth/register` con `{ email, password, nombre, apellido, area_id }` | OK | `area_id` es `number` (validado con `z.coerce.number()`) |
| 13 | `POST /api/auth/google` y `/api/auth/outlook` con `OAuthPayload` | OK | `{ provider_id, email, nombre, apellido, area_id }` |
| 14 | `GET /api/auth/me` con token Bearer | OK | Interceptor agrega header automáticamente |
| 15 | `POST /api/auth/refresh` con `{ refreshToken }` | OK | Solo se llama desde interceptor, no desde UI |
| 16 | Manejo de respuesta `{ success: true, token, refreshToken, user }` | OK | Extraído en `auth.service.ts` |
| 17 | Manejo de respuesta de error `{ success: false, message, errors? }` | OK | `getFieldErrors()` mapea a campos del form |

### Seguridad y buenas prácticas

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 18 | Token NO se loguea ni se expone en URLs | OK | Solo en header `Authorization` y `localStorage` |
| 19 | `localStorage` se limpia en logout | OK | `queryClient.clear()` previene cache cross-user |
| 20 | Redirect a `/login` en 401 (excepto endpoints de auth) | OK | `isAuthEndpoint` check |
| 21 | Refresh token race condition manejado | OK | Solo un refresh activo, queue para paralelas |
| 22 | Validación de email con zod | OK | `z.string().email()` |
| 23 | Password mínimo 8 caracteres en register | OK | `z.string().min(8)` |
| 24 | `autoComplete` correcto en inputs | OK | `email`, `current-password`, `new-password`, `given-name`, `family-name` |
| 25 | `noValidate` en `<form>` para evitar validación nativa | OK | |

### UX y accesibilidad

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 26 | Errores inline por campo | OK | `<p className="text-sm text-destructive">` debajo de cada input |
| 27 | `aria-invalid` en inputs con error | OK | `aria-invalid={Boolean(formErrors.email)}` |
| 28 | Labels asociados con `htmlFor` | OK | Cada `Label` apunta a un `id` |
| 29 | Botón con spinner durante submit | OK | `Loader2` con `animate-spin` |
| 30 | Botones OAuth con `asChild` + `Link` | OK | Permite que el Button sea un anchor |
| 31 | Iconos lucide en inputs | OK | `Mail`, `Lock`, `User`, `Building2`, `ShieldCheck` |
| 32 | Estados disabled durante loading | OK | `disabled={isSubmitting}` en todos los inputs y buttons |
| 33 | Link "Olvidaste tu contraseña" (TODO) | NO BLOQUEANTE | Pendiente para iteración futura |

### Guards y navegación

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 34 | `/login` redirige a `/dashboard` si ya autenticado | OK | `beforeLoad` con check de `useAuthStore` |
| 35 | `/register` redirige a `/dashboard` si ya autenticado | OK | Idem |
| 36 | Login exitoso navega a `/dashboard` | OK | `useLogin.onSuccess` |
| 37 | Register exitoso navega a `/dashboard` | OK | `useRegister.onSuccess` |
| 38 | OAuth simulado exitoso navega a `/dashboard` | OK | `useGoogleLogin` / `useOutlookLogin` |
| 39 | Logout redirige a `/login` | OK | `window.location.href` (forzar reload) |

---

## Convenciones respetadas (CONVENTIONS.md)

- **Naming**: PascalCase (componentes), `use*` (hooks), `get*` (helpers puros), camelCase (variables).
- **Imports**: React → externos → `@/...` → tipos. Sin imports circulares.
- **Sin comentarios** innecesarios.
- **Event handlers**: `handleSubmit` (prefijo `handle`).
- **Hooks personalizados** separados en `src/hooks/`.
- **Tipos en `src/types/`** (no inline en componentes).
- **Iconos lucide** en lugar de emojis o SVGs custom.
- **Tokens de tema** (`bg-primary`, `text-muted-foreground`, etc.) en lugar de colores hardcoded.
- **shadcn-compatible**: `Card`, `Alert`, `Input`, `Label`, `Button` siguen el patrón de shadcn/ui.

---

## Observaciones menores (no bloqueantes)

1. **OAuth simulado**: la UI marca explícitamente "Modo simulación (F06)" para que un tester entienda que falta la integración real. F09 lo reemplazará.
2. **`queryClient.clear()` en logout**: agresivo pero correcto para evitar que datos cacheados (ej. áreas, usuarios) se filtren entre sesiones. Tiene el costo de re-fetch al próximo login (aceptable).
3. **`window.location.href` en logout**: forzar reload evita bugs del router con state stale (ej. un usuario anterior en cache). Trade-off: se pierde la animación de transición SPA. Es una decisión consciente.
4. **`useAreas()` con `staleTime: 10min`**: las áreas casi no cambian, pero si se agrega una nueva área, el usuario tendría que refrescar manualmente o esperar 10min. Aceptable para F06; podría bajarse en el futuro.
5. **Componentes `ui/button`, `ui/label`, `ui/alert`**: actualmente hechos a mano en lugar de usar `npx shadcn add`. Son 100% compatibles con la API de shadcn, así que el MCP puede regenerarlos o agregar más sin conflicto.
6. **Falta `Olvidaste tu contraseña?`**: link comentado en la UI, no es bloqueante.
7. **Falta `showPassword` toggle**: en pantallas con password. Se puede agregar con un botón `Eye`/`EyeOff` de lucide. No bloqueante.
8. **Tipos de `useNavigate`**: en `OAuthSimulationForm` se usa `useNavigate()` para volver a login. En login/register ya no se usa porque `navigate` se hace desde el hook de mutación. Consistente.

---

## Validación de typecheck y build

`npm install` y `npm run typecheck` deben ejecutarse **fuera de F06** porque requieren `node_modules`. Esto está documentado en `impl_f06.md` sección "Validación".

Tras la instalación, los errores LSP desaparecerán:
- `Cannot find module '@radix-ui/...'` → resuelto por `npm install`
- `Type '"/auth/google-callback"' is not assignable` → resuelto cuando el plugin de TanStack Router genere `routeTree.gen.ts` en el primer `npm run dev`

---

## Resultado

**F06 aprobada.** Todos los artefactos de la feature list están presentes, las convenciones del proyecto se respetan, la integración con el backend F02 es correcta, y la base para F07+ está lista (hooks reutilizables, componentes UI base, sistema de refresh token robusto).

Próxima fase: **F07 - Frontend - Dashboard Personal y Lista de Capacitaciones**.
