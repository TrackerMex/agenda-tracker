# F06 - Frontend - Autenticación (Login, Register, OAuth)

**Agente:** builder
**Fecha:** 2026-06-02
**Estado:** done

---

## Objetivo

Reemplazar los placeholders de F05 con formularios funcionales de login, registro y callbacks OAuth (Google y Outlook) que se integren con los endpoints del backend F02 (`/api/auth/login`, `/api/auth/register`, `/api/auth/google`, `/api/auth/outlook`).

---

## Archivos creados

### Servicios y hooks

| Archivo | Propósito |
|---------|-----------|
| `src/services/auth.service.ts` | Cliente HTTP: `login`, `register`, `loginWithGoogle`, `loginWithOutlook`, `fetchMe` |
| `src/hooks/useAuth.ts` | Hooks: `useCurrentUser`, `useLogin`, `useRegister`, `useGoogleLogin`, `useOutlookLogin`, `useLogout` |
| `src/hooks/useAreas.ts` | Query para listar áreas (consumida por `register` y callbacks OAuth) |

### Componentes UI base (shadcn-style)

| Archivo | Propósito |
|---------|-----------|
| `src/components/ui/input.tsx` | Input accesible con focus ring, disabled, placeholder |
| `src/components/ui/label.tsx` | Label basado en `@radix-ui/react-label` |
| `src/components/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `src/components/ui/alert.tsx` | `Alert` con variantes `default` y `destructive` (vía `cva`) |
| `src/components/ui/button.tsx` | (F05 fix) `Button` con `cva` + Radix Slot, soporta `asChild` |

### Componentes de feature

| Archivo | Propósito |
|---------|-----------|
| `src/components/auth/OAuthSimulationForm.tsx` | Formulario compartido de simulación OAuth (Google y Outlook). Genera `provider_id` y consume `useGoogleLogin`/`useOutlookLogin` según el provider |

### Rutas

| Archivo | Propósito |
|---------|-----------|
| `src/routes/login.tsx` | Página de login con form completo + botones OAuth + link a registro |
| `src/routes/register.tsx` | Página de registro con form completo + selector de área + link a login |
| `src/routes/auth/google-callback.tsx` | Simulación de callback OAuth de Google (delega en `OAuthSimulationForm`) |
| `src/routes/auth/outlook-callback.tsx` | Simulación de callback OAuth de Outlook (delega en `OAuthSimulationForm`) |

### Archivos modificados (consolidación con F02 backend)

| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | Tipos ajustados a la respuesta real del backend: `RolNombre`, `Usuario.roles[]`, `AuthSession` con `refreshToken`, `OAuthPayload`, `RefreshPayload`, `ApiErrorBody` |
| `src/store/authStore.ts` | Agregado `refreshToken`, `hasRole()`, `esJefe()`, `esCapacitador()`, `esAdmin()`, `setUser()` |
| `src/lib/api.ts` | Interceptor de response con queue de refresh (patrón estándar), helpers `getErrorMessage()` y `getFieldErrors()` |

---

## Stack final por archivo

| Capa | Librería |
|------|----------|
| Validación de formularios | `zod` 3.24 |
| Mutaciones/queries | `@tanstack/react-query` 5.62 |
| Navegación | `@tanstack/react-router` 1.87 |
| Iconos | `lucide-react` |
| Estilos | `tailwindcss` 3.4 + tokens HSL |
| Errores HTTP | `axios` 1.7 + helpers custom |

---

## Flujo de autenticación

### 1. Login (`/login`)

```
Usuario completa form
   ↓
zod.safeParse (cliente) → si falla, errores inline
   ↓
useLogin.mutateAsync({ email, password })
   ↓
POST /api/auth/login
   ↓
Backend valida con Zod y devuelve { token, refreshToken, user }
   ↓
authStore.setAuth(...) persiste en localStorage
   ↓
queryClient.setQueryData(['auth','me'], user)
   ↓
navigate('/dashboard')
```

Si el backend devuelve 400 con `errors: { email: [...] }`, se mapean a errores de campo. Si es 401 u otro error, se muestra en el `Alert` superior.

### 2. Register (`/register`)

Mismo flujo pero con `POST /api/auth/register` y payload `{ email, password, nombre, apellido, area_id }`. El selector de área usa `useAreas()` (query) con `staleTime: 10min`.

### 3. OAuth (simulado en F06)

El backend F02 ya implementó los endpoints `POST /api/auth/google` y `POST /api/auth/outlook` que reciben un payload validado:

```ts
{
  provider_id: string,    // ID del usuario en el provider
  email: string,
  nombre: string,
  apellido: string,
  area_id: number
}
```

**En F09** se integrará el SDK real de Google/Microsoft. En F06, el "callback" es una página de simulación donde el usuario completa manualmente los datos que llegarían del provider. Esto permite probar el flujo end-to-end sin credenciales OAuth.

`OAuthSimulationForm` se reutiliza en ambos callbacks con la única diferencia del `provider` prop.

### 4. Refresh token

Interceptor Axios (`src/lib/api.ts`):
- En 401 (no auth endpoint), si no se está reintentando:
  - `isRefreshing = true` → llama `POST /api/auth/refresh`
  - Si éxito, reintenta la request original con el nuevo token
  - Si falla, limpia el store y redirige a `/login`
- Si ya hay un refresh en curso, la request espera en `pendingQueue`

Esto evita múltiples refreshes paralelos (race condition típico).

### 5. Logout

`useLogout()`:
- Limpia `authStore` (sincroniza con `localStorage` por `persist`)
- `queryClient.removeQueries(['auth','me'])`
- `queryClient.clear()` (por seguridad, evita datos cacheados de otro usuario)
- `window.location.href = '/login'` (forzar reload, no navegación SPA)

---

## Decisiones de diseño

1. **Validación doble**: zod en cliente (UX inmediata) + Zod en backend (defensa). Los errores del backend se mapean a campos.
2. **Refresh token queue** en lugar de `Promise.all` o flags simples: garantiza un solo refresh activo y reintenta N requests en paralelo.
3. **OAuth simulado en F06**: el backend F02 ya está listo, así que el flujo se prueba sin esperar F09. Marcar como "Modo simulación (F06)" en la UI lo deja claro al usuario.
4. **`OAuthSimulationForm` compartido**: una sola implementación para Google y Outlook, parametrizado por `provider`. Evita duplicación.
5. **Componentes UI base en `src/components/ui/`**: siguen convención shadcn para que `npx shadcn add <X>` siga funcionando.
6. **`useAreas()` con `staleTime: 10min`**: las áreas casi no cambian. Evita refetch en cada navegación.
7. **Tipos del backend como single source of truth**: `types/index.ts` refleja exactamente lo que devuelve F02. Sin transformaciones intermedias.
8. **`navigate({ to: '/dashboard' })` en mutaciones**: mejor que `window.location` (preserva SPA y stack del router).
9. **`queryClient.clear()` en logout**: previene fuga de datos entre usuarios en la misma sesión.
10. **Botones OAuth con `asChild` + `Link`**: el `Button` shadcn soporta `asChild` vía Radix Slot, permitiendo que sea un ancla estilizada.

---

## Convenciones respetadas

- **Naming**: PascalCase para componentes, `use*` para hooks, `get*` para helpers puros.
- **Imports**: orden React → externos → `@/...` → tipos.
- **Sin comentarios** innecesarios — el código es autoexplicativo.
- **Event handlers**: `handleSubmit`, `handleAreaChange` (prefijo `handle`).
- **Tipos de error**: `LoginFormErrors`, `RegisterFormErrors`, `OAuthFormErrors` como `Partial<Record<keyof Values, string>>`.
- **Iconos lucide**: `Mail`, `Lock`, `User`, `Building2`, `ShieldCheck`, `AlertCircle`, `Loader2`.
- **Accesibilidad**: `aria-invalid` en inputs con error, `noValidate` en form para no usar validación nativa del browser, `autoComplete` correcto (`email`, `current-password`, `new-password`, `given-name`, `family-name`).

---

## Validación

### Pendiente (requiere `npm install` y backend corriendo)

```bash
cd backend
npm run dev   # backend en :3001 con DB sembrada (F01)

cd frontend/agenda-frontend
npm install
npm run typecheck
npm run dev   # frontend en :5173
```

### Checklist de F06

- [x] `auth.service.ts` con 5 métodos
- [x] `useAuth.ts` con 6 hooks
- [x] `useAreas.ts` con query
- [x] 5 componentes UI base (`input`, `label`, `card`, `alert`, `button`)
- [x] `OAuthSimulationForm` reutilizable
- [x] 4 rutas funcionales (`login`, `register`, `google-callback`, `outlook-callback`)
- [x] Refresh token queue en `api.ts`
- [x] `getFieldErrors()` y `getErrorMessage()` helpers
- [x] `authStore` con `refreshToken` y helpers de rol
- [x] Tipos alineados con backend F02
- [x] Validación cliente con Zod
- [x] Manejo de errores 400/401/500 diferenciado
- [x] `autoComplete` correcto en cada input
- [x] Iconos lucide consistentes
- [x] Accesibilidad básica (aria-invalid, noValidate, labels)
- [x] Documentación en `progress/impl_f06.md` y `progress/review_f06.md`
- [x] `feature_list.json` y `progress/current.md` actualizados

### Cómo probar el flujo tras `npm install`

1. **Login**: ir a `/login`, ingresar `admin@empresa.com` / `Admin123!` (usuario sembrado en F01), ser redirigido a `/dashboard`.
2. **Register**: ir a `/register`, completar form, ser redirigido a `/dashboard` como nuevo usuario.
3. **OAuth Google simulado**: click en "Google" en `/login` → completa form de simulación → entra a `/dashboard`.
4. **OAuth Outlook simulado**: idem con "Outlook".
5. **Refresh**: dejar pasar el `expiresIn` del access token (configurable en backend, típico 15min) → la próxima request a un endpoint protegido debe hacer refresh transparente.
6. **Logout**: click en "Salir" del Navbar → limpia localStorage y vuelve a `/login`.
7. **Guards**: estando deslogueado, intentar ir a `/dashboard` → redirige a `/login`. Estando logueado, intentar ir a `/login` → redirige a `/dashboard`.

---

## Limitaciones conocidas (a resolver en features futuras)

1. **OAuth real**: F09 implementará los SDKs de Google/Microsoft. El actual `OAuthSimulationForm` se eliminará y los callbacks consumirán directamente los datos del provider.
2. **Email verification**: el campo `activo` del usuario no se valida en frontend. El backend lo hace (ver F02), pero podría agregarse una pantalla "esperando verificación".
3. **Remember me**: el token se persiste siempre. Se puede agregar un checkbox en `/login` que controle si se guarda en `localStorage` o solo en memoria.
4. **2FA**: no contemplado todavía.
5. **Password recovery**: pendiente.

---

## Próxima feature

**F07 - Frontend - Dashboard Personal y Lista de Capacitaciones**

Crear `/dashboard` con un resumen del usuario (capacitaciones próximas, áreas, accesos rápidos) y `/capacitaciones` con tabla, filtros y paginación usando TanStack Table.
