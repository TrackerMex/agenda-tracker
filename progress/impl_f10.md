# F10 - Frontend - Dashboard Jefe de Area

**Estado:** done
**Fecha de implementacion:** 2026-06-02
**Agente:** builder
**Dependencias:** F08 (done), F03 endpoint `/api/areas/:id/personal` (done), F04 endpoint `/api/areas/:id/capacitaciones` (done)

---

## Resumen

Se implemento el dashboard completo para el jefe de area, incluyendo gestion visual de su personal, las capacitaciones del area y el flujo critico de toma de asistencia. La feature se compone de tres paginas (`/dashboard/area`, `/dashboard`, `/capacitaciones/$id/asistencia`) y dos componentes nuevos (`PersonalTable`, `AsistenciaList`).

## Decisiones de diseno

### 1. Refactor de rutas a layouts anidados con `Outlet`

Para soportar `/capacitaciones/$id/asistencia` como ruta hija del detalle, fue necesario convertir dos rutas standalone en layouts:

- `routes/dashboard.tsx` → layout (solo `<Outlet />`) + nueva `routes/dashboard.index.tsx` con el contenido previo del dashboard personal
- `routes/capacitaciones/$id.tsx` → layout (solo `<Outlet />`) + nueva `routes/capacitaciones/$id.index.tsx` con el contenido previo del detalle

Esto es consistente con las convenciones de TanStack Router file-based: un archivo en `routes/` solo actua como layout si tiene `<Outlet />`; sus hijos son `<name>.index.tsx` (default) y `<name>/<sub>.tsx` (anidados). `routes/dashboard.area.tsx` y `routes/capacitaciones/$id/asistencia.tsx` ahora se montan correctamente.

### 2. PersonalTable: tabla con busqueda cliente + 4 columnas

Encapsula la busqueda (input controlada con icono `Search`) y el filtrado de personal por nombre, email o rol. Muestra 4 columnas (Persona, Email, Roles, Estado) con `Badge` shadcn-style: Admin (destructive), Jefe (success), Capacitador (warning), Usuario (outline). Footer "Mostrando N de M personas" con pluralizacion correcta. Skeleton state durante `isLoading` con `animate-pulse` (3 filas placeholder).

### 3. AsistenciaList: componente presentacional con dirty tracking

Componente reutilizable y desacoplado de la mutacion. La pagina `/asistencia` mantiene el `drafts` map (`Record<registroId, { asistio, comentarios }>`) y delega el renderizado del dirty badge, los botones de toggle y el textarea expandible a `AsistenciaList`. El componente acepta `isReadOnly` para futuro uso (mostrar asistencia ya cerrada sin permitir edicion). El boton "Nota" pasa a "Editar nota" cuando hay comentarios.

### 4. Dashboard area con stat cards y grupos de caps

4 stat cards calculados en cliente: `personas`, `capacitadores` (roles `capacitador` | `jefe_area` | `admin`), `caps activas` (estado=programada), `inscriptos totales` (suma de inscritos de todas las caps del area). Las caps se agrupan en 3 sub-secciones:
- **Proximas**: programadas con fecha >= hoy
- **Realizadas (pendientes de cerrar)**: programadas con fecha < hoy
- **Cerradas**: completada + cancelada

Cada cap muestra "Ver detalle" (siempre) y "Tomar asistencia" (solo si no esta cancelada). Esto evita que el jefe vaya a tomar asistencia de una cap que ya no se realizo.

### 5. Boton "Tomar asistencia" en el detail page

En `routes/capacitaciones/$id.index.tsx` (sticky action bar) se agrego un `Button asChild` con `<Link to="/capacitaciones/$id/asistencia">` visible solo si `canManageAttendance` (jefe_area o admin). Para usuarios regulares, la action bar muestra solo "Registrarme" / "Desinscribirme".

### 6. Asistencia: per-row save + save all + feedback alert

La pagina de asistencia tiene dos formas de guardar:
- **Por fila**: boton per-row con el apellido del usuario (permite guardar parcialmente)
- **Global**: boton "Guardar todo" en el header con badge de count `dirtyCount`

Ambos deshabilitados cuando no hay cambios dirty. Despues de guardar, se muestra una `Alert` con feedback de exito o error (`setFeedback`). El `useMarcarAsistencia` invalida `KEY_ALL` y `detalleKey(id)` para refrescar el detail page y la lista de caps del area.

### 7. Canceladas: read-only con alert explicativo

Si la capacitacion esta cancelada, la pagina de asistencia muestra una `Alert variant="destructive"` y NO renderiza stats / lista / save buttons. Esto evita que el jefe tome asistencia de un evento que no se realizo.

### 8. Filtro de "capacitadores" en stat card

Para el conteo de "Capacitadores" del area, se cuentan los usuarios con rol `capacitador` O `jefe_area` O `admin` (los unicos que pueden ser seleccionados como capacitador en el form de crear, F08). Logica inversa a lo que hace el backend al validar (`capacitaciones.service.js:67`), pero es la regla de UI.

## Artefactos creados

### 1. `components/capacitacion/PersonalTable.tsx`

Tabla presentacional con props: `personal: PersonalArea[]`, `isLoading?: boolean`, `emptyTitle?`, `emptyDescription?`. Internamente maneja una `Input` controlada (`useState`) y aplica `useMemo` para el filtrado. Mapea `RolNombre` a `Badge variant` segun la tabla ROLE_BADGE.

### 2. `components/capacitacion/AsistenciaList.tsx`

Componente presentacional con props:
- `registros: RegistroCapacitacion[]`
- `drafts: AsistenciaDraftMap` (`Record<registroId, { asistio, comentarios }>`)
- `onChange: (registroId, draft) => void`
- `pendingId: number | null` (para mostrar loader)
- `disabled?: boolean`
- `isReadOnly?: boolean` (muestra badges en vez de botones)

Internamente ordena por apellido ascendente y maneja un `expandedId` para el textarea de comentarios. Los botones "Asistio" / "No asistio" usan `aria-pressed` y variantes semanticas (default verde vs destructive). El `Badge warning "Sin guardar"` aparece solo si `draft !== original` Y no es read-only.

### 3. `routes/dashboard.area.tsx`

Pagina con `beforeLoad` que verifica `jefe_area` o `admin`. Carga `useAreas()`, `usePersonalArea(areaId)`, `useCapacitacionesByArea(areaId)`. Calcula stats y grupos. Renderiza: header con nombre del area, 4 StatCards, PersonalTable, seccion de capacitaciones con grupos condicionales. Si el usuario no es admin Y no tiene area_id, muestra EmptyState "Sin area asignada".

### 4. `routes/dashboard.index.tsx` (NUEVO - movido desde dashboard.tsx)

Contiene el dashboard personal previo (saludo, 4 stat cards personales, "Mis proximas", "Accesos rapidos" condicionales al rol). Usa `createFileRoute('/dashboard/')`.

### 5. `routes/capacitaciones/$id.index.tsx` (NUEVO - movido desde $id.tsx)

Contiene el detail page previo: info, capacitador, inscriptos, sticky action bar con el nuevo boton "Tomar asistencia" condicional. Usa `createFileRoute('/capacitaciones/$id/')`.

### 6. `routes/capacitaciones/$id.tsx` (refactorizado a layout)

Solo contiene `Outlet` + `beforeLoad` de auth. No renderiza UI propia.

### 7. `routes/capacitaciones/$id/asistencia.tsx`

Pagina con `beforeLoad` que verifica `jefe_area` o `admin`. Carga `useCapacitacion(id)` + `useMarcarAsistencia()`. Mantiene `drafts: AsistenciaDraftMap`, `pendingId: number | null`, `feedback: { id, ok, msg } | null`. Sincroniza drafts cuando llegan nuevos registros via `useEffect([registros])`. `handleSave(reg)` por fila, `handleSaveAll()` global. Stats memoizadas: total, asistio (cuenta drafts con asistio=true O reg.asistio=true), pendiente. Si cancelada: alert + sin contenido editable.

### 8. Extensions en services y hooks

- `services/capacitaciones.service.ts`: agregado `listByArea(areaId)` → `GET /api/areas/:areaId/capacitaciones`
- `hooks/useCapacitaciones.ts`: agregado `useCapacitacionesByArea(areaId)` con `enabled: areaId > 0`

## Cambios en archivos existentes

- `routes/dashboard.tsx`: convertido a layout (15 lineas, solo `<Outlet />`)
- `routes/capacitaciones/$id.tsx`: convertido a layout (15 lineas, solo `<Outlet />`)

## Verificacion (navegador)

Smoke tests pasaron como `juan.perez@empresa.com` (jefe_area):

1. Login juan.perez → sidebar muestra 4 items (Mi Dashboard, Capacitaciones, Crear Capacitacion, Mi Area)
2. GET `/dashboard/area` → header "Desarrollo", 4 stat cards (26 personas, 6 capacitadores, 3 caps activas, 6 inscriptos), PersonalTable con 26 personas, buscador funcional, "Proximas" (3 caps) con "Ver detalle" + "Tomar asistencia", "Cerradas" (1 cap cancelada) SIN "Tomar asistencia"
3. Buscar "Lopez" en PersonalTable → filtra a 1 fila ✅
4. GET `/capacitaciones/1/asistencia` → "Tomar asistencia" + "Introducción a React 19", 3 stat cards (1/0/1), lista con Browser Test
5. Click "Asistio" en Browser Test → "Sin guardar" badge aparece, "Guardar todo 1" se habilita, stats: Asistieron 1 / Pendientes 0, "Asistio" pressed
6. Click per-row "Test" save → alert "Asistencia de Browser guardada.", "Sin guardar" desaparece, "Guardar todo" disabled
7. Verificado via `curl GET /api/capacitaciones/1` → `asistio: True` para Browser Test
8. Click "Nota" → expande textarea, escribir "Llegó 5 minutos tarde, participó activamente" → "Sin guardar" reaparece
9. Click "Guardar todo" → alert "Se guardaron 1 actualizacion.", textarea persiste con comentario
10. Verificado via `curl` → comentario persistido en backend
11. GET `/capacitaciones/1` (detail) → "Inscriptos" muestra "Asistio" para Browser Test
12. GET `/capacitaciones/4/asistencia` (cap cancelada) → alert "Capacitacion cancelada" + "No se puede tomar asistencia porque la capacitacion esta cancelada.", sin stats/lista/buttons
13. Logout + login `browser.test@empresa.com` (rol usuario) → sidebar solo 2 items, sin "Crear Capacitacion", sin "Mi Area"
14. Intentar GET `/dashboard/area` como usuario → redirect a `/dashboard` ✅
15. Intentar GET `/capacitaciones/1/asistencia` como usuario → redirect a `/dashboard` ✅
16. GET `/capacitaciones/1` como usuario → detail page sin "Tomar asistencia" button (solo "Desinscribirme" porque esta inscripto) ✅
17. `npm run typecheck` → 0 errores ✅
18. No console errors ni warnings

## Decisiones de diseno (resumen)

- **Patron useState + zod** (no react-hook-form): consistente con F06 y F08
- **Componentes controlados** (AsistenciaList no controla su propio drafts, recibe callbacks)
- **Composable Asistencialist**: reutilizable para read-only y edit
- **Layouts TanStack**: usar `<Outlet />` permite rutas hijas con deep linking
- **Canceladas son read-only**: UX mas simple y consistente
- **Feedback alert global**: la misma UI muestra exito o error de save all/per-row

## Lecciones aprendidas

- **TanStack Router file-based requiere `<Outlet />` para que hijos rendericen**: un archivo `.tsx` en `routes/` solo es layout si explicitamente usa `<Outlet />`; sino, sus hijos son ignorados y el parent renderiza su propio contenido.
- **El orden de imports del route tree afecta el path**: mover contenido de un standalone a `.<name>.index.tsx` es la forma idiomática de convertir un standalone en layout.
- **chrome-devtools `click` no dispara `onSubmit`** en forms React; workaround: `evaluate_script` con `submitBtn.click()`.
- **LSP cache** puede mostrar errores por archivos ya borrados; forzar con `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit`.
- **El componente AsistenciaList acepta `isReadOnly`**: aunque F10 no usa ese modo, queda listo para vista historica de caps cerradas (futuro).

## Proximo paso

Iniciar **F11 - Backend - Dashboard y Reportes** (endpoints `GET /api/dashboard/area/:id` y `GET /api/dashboard/usuario` para alimentar dashboard con datos agregados server-side, posible optimizacion para 100+ usuarios).

Alternativa: **F09 - Backend - Integraciones Externas** (Google Calendar, Microsoft Graph, email).
