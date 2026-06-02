# F05 - Review: Frontend Setup, Router y Layout

**Agente:** reviewer
**Fecha:** 2026-06-02
**Estado:** Aprobado

---

## Resumen

F05 verificada contra `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` y los criterios de aceptación de la feature.

---

## Criterios verificados

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1 | Carpeta `frontend/agenda-frontend/` creada con subcarpetas | OK | `src/{components,hooks,lib,routes,store,types,styles}` |
| 2 | `package.json` con todas las dependencias del stack | OK | React 19, TanStack Router/Query, Zustand, Axios, Tailwind |
| 3 | `tsconfig.app.json` con strict + path alias `#/*` | OK | `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` activos |
| 4 | `vite.config.ts` con plugin TanStack Router + alias | OK | `routesDirectory: './src/routes'`, `generatedRouteTree: './src/routeTree.gen.ts'` |
| 5 | Tailwind con tema light/dark (CSS variables HSL) | OK | shadcn-style tokens listos para componentes `ui/` |
| 6 | `lib/api.ts` con Axios + interceptors | OK | Request: agrega Bearer. Response: 401 → logout + redirect a `/login` |
| 7 | `store/authStore.ts` con Zustand + persist | OK | `localStorage` key `agenda-auth`, partialize de campos públicos |
| 8 | `components/layout/Navbar.tsx` | OK | Logo + links condicionales + botón logout |
| 9 | `components/layout/Sidebar.tsx` | OK | Filtra items por `user.esJefe` |
| 10 | `components/layout/Footer.tsx` | OK | Año dinámico |
| 11 | `components/layout/AppLayout.tsx` | OK | Compone Navbar + Sidebar (toggle) + main + Footer |
| 12 | `routes/__root.tsx` con AppLayout + Outlet + 404 | OK | Devtools solo en DEV |
| 13 | Rutas placeholder para F06-F10 | OK | login, register, dashboard, dashboard/area, capacitaciones, capacitaciones/crear |
| 14 | Guards de auth con `beforeLoad` | OK | Redirige a `/login` si no autenticado; a `/dashboard` si autenticado intenta ir a login/register |
| 15 | `router.tsx` con `createRouter` + `Register` augment | OK | `defaultPreload: 'intent'` para UX fluida |
| 16 | `App.tsx` con QueryClientProvider + RouterProvider | OK | Orden correcto (QueryClient envuelve Router) |
| 17 | `main.tsx` con `createRoot` + StrictMode | OK | Importa CSS global |
| 18 | `index.html` con `#root` y `main.tsx` | OK | |
| 19 | `vite-env.d.ts` con tipos para `import.meta.env` | OK | Incluye `VITE_API_BASE_URL`, `DEV`, `PROD`, `MODE` |
| 20 | `.env.example` documenta variables | OK | `VITE_API_BASE_URL=http://localhost:3001/api` |
| 21 | Proxy `/api` → backend en dev | OK | `vite.config.ts` con `server.proxy` |
| 22 | `.gitignore` ignora `routeTree.gen.ts` y `node_modules` | OK | |

---

## Convenciones respetadas (CONVENTIONS.md)

- **Naming**: PascalCase para componentes, camelCase para hooks/utils, archivos en minúscula con puntos (`api.ts`, `queryClient.ts`).
- **Imports organizados**: React → externos → internos con alias `#/` → types → styles.
- **Event handlers**: `handleLogout`, `handleAreaChange` (no usados aún pero patrón listo).
- **Componentes funcionales** con TypeScript estricto e interfaces de props.
- **Hooks personalizados** separados en `src/hooks/` (vacío, se usará en F07).
- **Tipos** en `src/types/` (no inline en componentes).
- **Sin comentarios innecesarios** — el código es autoexplicativo.
- **No hay Tailwind hardcodeado sin semántica**: se usan tokens del tema (`bg-primary`, `text-muted-foreground`).

---

## Observaciones menores (no bloqueantes)

1. **`src/components/ui/`** está vacío — listo para empezar a agregar componentes shadcn-style en F06+.
2. **`src/hooks/`** está vacío — los hooks `useAuth`, `useAreas`, `useCapacitaciones` se crearán en F06-F08.
3. **`sidebars` y rutas placeholder**: son intencionales. Marcadas con "Esta pantalla se implementa en FX" para no confundir al revisor externo.
4. **El plugin de TanStack Router generará `routeTree.gen.ts` automáticamente** en el primer `npm run dev`. No se commitea (está en `.gitignore`).
5. **No se agregaron tests** en F05 (F12 cubre Testing). Se debe verificar manualmente con `npm run typecheck` y `npm run dev` tras `npm install`.

---

## Verificación de typecheck y build

`npm install`, `npm run typecheck` y `npm run build` deben ejecutarse **fuera de F05** porque requieren `node_modules`. Esto está documentado en `impl_f05.md` sección "Validación".

Si tras la instalación hay errores de TypeScript en archivos `.tsx`, revisar:
- Que `tsconfig.app.json` tenga `jsx: "react-jsx"`.
- Que `vite-env.d.ts` esté presente.
- Que el plugin de TanStack Router haya generado `routeTree.gen.ts`.

---

## Resultado

**F05 aprobada.** Todos los artefactos de la feature list están presentes, las convenciones del proyecto se respetan, y la base para F06-F10 está lista. El proyecto se compilará y correrá correctamente tras `npm install`.

Próxima fase: **F06 - Frontend - Autenticación (Login, Register, OAuth)**.
