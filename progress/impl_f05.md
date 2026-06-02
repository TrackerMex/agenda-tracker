# F05 - Frontend Setup, Router y Layout

**Agente:** builder
**Fecha:** 2026-06-02
**Estado:** done

---

## Objetivo

Inicializar el proyecto frontend con Vite + React 19 + TypeScript, configurar el stack completo (TanStack Router, TanStack Query, Zustand, Axios, Tailwind) y dejar lista la estructura de carpetas, router con rutas placeholder, layout (Navbar/Sidebar/Footer), cliente Axios con interceptors y store de auth.

---

## Archivos creados

### Configuración

| Archivo | Propósito |
|---------|-----------|
| `frontend/agenda-frontend/package.json` | Dependencias y scripts (dev, build, lint, typecheck) |
| `frontend/agenda-frontend/tsconfig.json` | Project references |
| `frontend/agenda-frontend/tsconfig.app.json` | TS estricto + path alias `#/*` → `./src/*` |
| `frontend/agenda-frontend/tsconfig.node.json` | TS para vite.config.ts |
| `frontend/agenda-frontend/vite.config.ts` | Vite + plugin TanStack Router + alias + proxy /api |
| `frontend/agenda-frontend/tailwind.config.js` | Tokens de tema light/dark con CSS variables |
| `frontend/agenda-frontend/postcss.config.js` | PostCSS + Tailwind + Autoprefixer |
| `frontend/agenda-frontend/index.html` | Entry HTML con `#root` y `main.tsx` |
| `frontend/agenda-frontend/.env.example` | `VITE_API_BASE_URL` |
| `frontend/agenda-frontend/.gitignore` | Ignora node_modules, dist, routeTree.gen.ts |

### Estilos

| Archivo | Propósito |
|---------|-----------|
| `src/styles/globals.css` | Tailwind base + componentes utilitarios (`.btn-primary`, `.input`, `.card`) |

### Tipos y librerías

| Archivo | Propósito |
|---------|-----------|
| `src/lib/api.ts` | Instancia Axios con baseURL, interceptors de request (Bearer token) y response (logout en 401) |
| `src/lib/queryClient.ts` | TanStack Query client (staleTime 5min, retry 1) |
| `src/lib/utils.ts` | `cn()`, `formatDate()`, `formatTime()` |
| `src/types/index.ts` | Interfaces `Area`, `Usuario`, `AuthResponse` |
| `src/vite-env.d.ts` | Tipos para `import.meta.env` |

### Store

| Archivo | Propósito |
|---------|-----------|
| `src/store/authStore.ts` | Zustand con persist en localStorage: `user`, `token`, `isAuthenticated`, `setAuth`, `setUser`, `logout` |

### Layout

| Archivo | Propósito |
|---------|-----------|
| `src/components/layout/Navbar.tsx` | Header con logo, links condicionales y botón login/logout |
| `src/components/layout/Sidebar.tsx` | Nav lateral; muestra items de jefe solo si `user.esJefe` |
| `src/components/layout/Footer.tsx` | Pie de página con año dinámico |
| `src/components/layout/AppLayout.tsx` | Compone Navbar + Sidebar (opcional) + main + Footer |

### Router y rutas

| Archivo | Propósito |
|---------|-----------|
| `src/router.tsx` | `createRouter` con `routeTree` y `queryClient` en context; registra tipos |
| `src/routes/__root.tsx` | Root con `AppLayout` + `Outlet` + `TanStackRouterDevtools` (solo DEV) + 404 |
| `src/routes/index.tsx` | Landing page pública con features y CTAs |
| `src/routes/login.tsx` | Placeholder (F06) con `beforeLoad` redirect a `/dashboard` si auth |
| `src/routes/register.tsx` | Placeholder (F06) |
| `src/routes/dashboard.tsx` | Placeholder (F07) protegido con `beforeLoad` redirect a `/login` |
| `src/routes/dashboard/area.tsx` | Placeholder (F10) protegido, jefe de área |
| `src/routes/capacitaciones/index.tsx` | Placeholder (F07) protegido |
| `src/routes/capacitaciones/crear.tsx` | Placeholder (F08) protegido |

### App

| Archivo | Propósito |
|---------|-----------|
| `src/App.tsx` | Compone `QueryClientProvider` + `RouterProvider` |
| `src/main.tsx` | `createRoot` + `StrictMode` + import CSS global |

---

## Stack instalado

- **React 19** + **TypeScript 5.7** (strict)
- **Vite 6** con `@vitejs/plugin-react` y `@tanstack/router-vite-plugin`
- **TanStack Router 1.87** (file-based routing, code-splitting automático)
- **TanStack Query 5.62** (cache, devtools en F12)
- **Zustand 5** + `persist` middleware (localStorage)
- **Axios 1.7** con interceptors
- **Tailwind CSS 3.4** con tema HSL y dark mode
- **lucide-react** para iconos
- **Zod 3.24** para futuras validaciones
- **clsx** + **tailwind-merge** para `cn()`

---

## Decisiones de diseño

1. **Path alias `#/*`** → `./src/*` (TypeScript + Vite) para imports limpios.
2. **Code-splitting**: rutas se cargan lazy automáticamente por TanStack Router file-based.
3. **Proxy `/api`** en Vite → `http://localhost:3001` para evitar CORS en dev.
4. **Interceptors Axios**:
   - Request: agrega `Authorization: Bearer <token>` desde el store
   - Response: en 401 limpia el store y redirige a `/login`
5. **Rutas protegidas con `beforeLoad`**: aprovechan el ciclo del router (más limpio que un `useEffect` en cada página).
6. **Sidebar condicional por rol**: filtra items con `requireJefe` según `user.esJefe`.
7. **`__root.tsx` con AppLayout**: garantiza que TODO el árbol tenga el layout.
8. **404 incluido en root** vía `notFoundComponent`.
9. **Devtools solo en DEV** (`import.meta.env.DEV`).
10. **CSS variables HSL** para tema — permite dark mode sin reescribir clases.

---

## Validación

### Pendiente (requiere `npm install` en el frontend)

```bash
cd frontend/agenda-frontend
npm install
npm run typecheck    # debería pasar sin errores
npm run build        # debería generar dist/
npm run dev          # debería abrir http://localhost:5173
```

### Checklist de F05

- [x] Proyecto Vite + React 19 + TypeScript creado
- [x] Tailwind configurado con tema light/dark
- [x] TanStack Router file-based configurado (plugin en vite.config.ts)
- [x] TanStack Query client exportado
- [x] Axios con interceptors de auth
- [x] Zustand store con persist
- [x] Layout completo: Navbar, Sidebar, Footer, AppLayout
- [x] Rutas placeholder para todas las features futuras (F06-F10)
- [x] Guards de autenticación (`beforeLoad`) en rutas privadas
- [x] Landing page pública con features
- [x] 404 incluido
- [x] Alias `#/*` configurado en TS y Vite
- [x] Proxy `/api` configurado para dev
- [x] Archivos `progress/impl_f05.md` y `progress/review_f05.md`
- [x] `feature_list.json` y `progress/current.md` actualizados

### Cómo verificar tras `npm install`

1. `npm run dev` → debe abrir `http://localhost:5173` mostrando la landing page.
2. Click en "Iniciar sesión" → debe ir a `/login` (placeholder).
3. Click en "Registrarse" → debe ir a `/register` (placeholder).
4. Intentar entrar a `/dashboard` sin estar logueado → debe redirigir a `/login`.
5. La consola no debe mostrar errores 404 de módulos.

---

## Próxima feature

**F06 - Frontend - Autenticación (Login, Register, OAuth)**

Reemplazar los placeholders de `/login` y `/register` con formularios funcionales que llamen a `POST /api/auth/login`, `POST /api/auth/register` y manejen los callbacks OAuth de Google/Outlook.
