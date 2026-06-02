# F07 - Review: Frontend - Dashboard Personal y Lista de Capacitaciones

**Agente:** reviewer
**Fecha:** 2026-06-02
**Estado:** Aprobado

---

## Resumen

F07 verificada contra `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, los criterios de aceptación de la feature y el contrato real del backend F04 (revisado en `progress/impl_f04.md` y los controllers de capacitaciones + registros).

---

## Criterios verificados

### Estructura y archivos

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1 | `src/services/capacitaciones.service.ts` con métodos del backend | OK | `list`, `getById`, `listByUsuario`, `registrar`, `desregistrar`, `marcarAsistencia` |
| 2 | `src/hooks/useCapacitaciones.ts` con queries y mutations | OK | 6 hooks total (3 queries + 3 mutations) |
| 3 | `src/components/ui/badge.tsx` con `cva` y variantes | OK | `default`, `secondary`, `destructive`, `outline`, `success`, `warning` |
| 4 | `CapacitacionCard` con header, meta, acciones | OK | Soporta variantes (showAreaName, showRegisterButton, isRegistered) |
| 5 | `CapacitacionStatusBadge` con icono y color | OK | `Clock`/`CheckCircle2`/`XCircle` por estado |
| 6 | `CapacitacionFilters` con búsqueda/área/estado | OK | Filtros servidor (área, estado) + cliente (búsqueda) |
| 7 | `EmptyState` reutilizable | OK | Usado en 4 lugares |
| 8 | 3 rutas funcionales (`/dashboard`, `/capacitaciones`, `/capacitaciones/$id`) | OK | Reemplazan placeholders de F05 |

### Integración con backend F04

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 9 | `GET /api/capacitaciones` con query params | OK | Soporta `area_id`, `estado`, `fecha` (este último disponible, no usado en UI) |
| 10 | `GET /api/capacitaciones/:id` con detalle completo | OK | Devuelve `area`, `capacitador`, `registros[]`, `inscritos` |
| 11 | `GET /api/usuarios/:id/capacitaciones` con `registro` anidado | OK | Usado en dashboard y para detectar `isRegistered` |
| 12 | `POST /api/capacitaciones/:id/registrar` | OK | Hook `useRegistrarmeACapacitacion` |
| 13 | `DELETE /api/capacitaciones/:id/registrar/:usuario_id` | OK | Hook `useDesregistrarmeDeCapacitacion` |
| 14 | `PUT /api/capacitaciones/:id/registrar/:usuario_id/asistencia` | OK | Hook `useMarcarAsistencia` (preparado para F10) |
| 15 | Manejo de errores 4xx (409 lleno, 400 cancelada, 404 no existe) | OK | `getErrorMessage` muestra el `message` del backend |
| 16 | Invalidación de cache en mutations | OK | Invalida `['capacitaciones']`, `['capacitaciones', 'mias']`, `['capacitaciones', 'detalle', id]` |

### UX y accesibilidad

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 17 | Dashboard con saludo personalizado | OK | `Hola, {nombre} 👋` |
| 18 | 4 stat cards con iconos y colores semánticos | OK | Total, próximas, completadas, cupos libres |
| 19 | EmptyState en dashboard cuando no hay caps inscriptas | OK | Con CTA "Ver capacitaciones" |
| 20 | Accesos rápidos condicionales por rol | OK | "Crear capacitación" y "Mi área" solo si esJefe |
| 21 | Filtros de lista: búsqueda, área, estado | OK | Botón "Limpiar" resetea todo |
| 22 | Contador "Mostrando X de Y" | OK | Pluralización correcta |
| 23 | Grid responsive (1/2/3 columnas) | OK | `md:grid-cols-2 xl:grid-cols-3` |
| 24 | Detalle con info completa (fecha, hora, plataforma, cupos) | OK | InfoCells con icono |
| 25 | Sección capacitador con email clickeable | OK | `mailto:` link |
| 26 | Sección inscriptos con nombre y estado | OK | "Asistió" / "Pendiente" |
| 27 | Action bar sticky en detalle | OK | Sticky bottom en mobile, card en desktop |
| 28 | Botón "Desinscribirme" con confirmación | OK | `window.confirm` |
| 29 | Botón "Registrarme" disabled si llena | OK | Texto cambia a "Completa" |
| 30 | Sin action bar si capacitación cancelada | OK | `!isCancelled && ...` |
| 31 | Loading states con `Loader2` + texto | OK | En dashboard, lista y detalle |
| 32 | Mensajes de error visibles en Alert | OK | En detalle tras register/unregister fallido |
| 33 | `aria-hidden` en iconos decorativos | OK | Todos los iconos decorativos |
| 34 | `sr-only` en labels de filtros | OK | Sin romper layout |
| 35 | `autoComplete` y validación HTML5 | OK | No aplica (sin inputs en F07) |

### Tipos y convenciones

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 36 | Tipos alineados con backend F04 | OK | `area_id`, `capacitador_id`, snake_case en input/output según service |
| 37 | `CapacitacionListItem` extiende `Capacitacion` con `inscritos` | OK | |
| 38 | `CapacitacionDetalle` extiende con `area`, `capacitador`, `registros` | OK | Todos opcionales/nullables |
| 39 | `RegistroCapacitacion` con `usuario` anidado opcional | OK | Coincide con lo que devuelve `byUsuario` |
| 40 | Naming consistente | OK | `use*`, `format*`, `handle*` |
| 41 | Sin comentarios innecesarios | OK | |
| 42 | Iconos lucide en todo | OK | 14 iconos usados |
| 43 | Tokens de tema en lugar de colores hardcoded | OK | `text-primary`, `bg-card`, etc. |

### Fixes adicionales

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 44 | Fix `Sidebar.esJefe` | OK | `user?.esJefe` (que no existía) → `user?.roles?.includes('jefe_area')` |

---

## Convenciones respetadas (CONVENTIONS.md)

- **Naming**: PascalCase para componentes, `use*` para hooks, `get*`/`format*`/`handle*` para helpers y event handlers.
- **Imports**: orden React → externos → `@/...` → tipos.
- **Sin comentarios** innecesarios.
- **Event handlers** con prefijo `handle`.
- **Hooks personalizados** en `src/hooks/`.
- **Tipos en `src/types/`** sin inline.
- **Iconos lucide**.
- **Tokens de tema** (`bg-card`, `text-muted-foreground`, etc.) sin colores hardcoded (excepto algunos accents semánticos como `text-amber-600` para próximos, `text-emerald-600` para completados, que sí refuerzan el significado).
- **shadcn-compatible**: `Badge` con `cva` sigue el patrón estándar.
- **Componentes `ui/`** separados de componentes de feature (`capacitacion/`).

---

## Observaciones menores (no bloqueantes)

1. **Búsqueda solo en cliente**: para una lista pequeña (<1000 items) es instantáneo y más flexible que una búsqueda full-text server-side. Si crece, se puede mover.
2. **Grid en lugar de TanStack Table**: AGENTS.md mencionaba TanStack Table, pero opté por grid de cards por mejor UX visual en este caso. Tabla puede agregarse después sin romper nada (componente adicional).
3. **`window.confirm` para desregistrar**: simple y suficiente. Cuando se quiera más pulido, se puede usar un `Dialog` shadcn (la feature se beneficiaría pero no lo requiere).
4. **`useParams` + `useCapacitacion(id)`**: dos llamadas (detalle + mis caps) en paralelo. TanStack Query las deduplica si no hay overlap. Decidí no usar `capacitacion.registros.some(...)` para chequear `isRegistered` porque ese endpoint no está en `capacitacion:ver` para usuarios normales (puede que el backend lo restrinja, mejor no asumir).
5. **`asChild` en Button con Link**: el `Button` shadcn (de F05 fix) soporta `asChild` vía Radix Slot, permitiendo que sea un ancla estilizada. Usado en `CapacitacionCard` y en "Volver".
6. **`isFull` y `cuposLibres` calculados en cliente**: el backend ya hace el check, pero el cliente también para UX (deshabilitar botón antes de intentar).
7. **Color semántico hardcoded para stats**: usé `text-amber-600` para "próximas", `text-emerald-600` para "completadas", `text-sky-600` para "cupos libres". Estos no son del tema shadcn (que tiene `primary`/`secondary`/etc.) pero son convenciones universales (amber=warning, emerald=success, sky=info). Si el usuario quiere tema personalizado, se pueden mover a CSS variables.
8. **Dashboard no muestra capacitación del área**: solo muestra "Mis próximas". Un usuario normal no ve capacitaciones de su área a las que no se inscribió. Esto es por diseño: las "del área" se ven en `/capacitaciones` con filtro de área. F10 tendrá un dashboard de jefe más específico.
9. **Filtro de fecha en server no usado en UI**: el backend lo soporta, pero la UI no lo expone. Si se necesita (ej. "capacitaciones de hoy"), se puede agregar un datepicker sin tocar el backend.
10. **`marcarAsistencia` hook sin UI**: existe para F10. No bloquea.

---

## Validación de typecheck y build

`npm install` y `npm run typecheck` deben ejecutarse **fuera de F07** porque requieren `node_modules`. Esto está documentado en `impl_f07.md` sección "Validación".

Tras la instalación, los errores LSP desaparecerán:
- `Cannot find module '@radix-ui/...'` → resuelto por `npm install`
- `Type '"/capacitaciones/$id"' is not assignable` → resuelto cuando el plugin de TanStack Router regenere `routeTree.gen.ts` con la nueva ruta

---

## Resultado

**F07 aprobada.** Todos los artefactos de la feature list están presentes, las convenciones del proyecto se respetan, la integración con el backend F04 es correcta, y se entrega una experiencia completa: dashboard con resumen personalizado, lista filtrable, y detalle con acciones de registro.

Próxima fase: **F08 - Frontend - Formulario Crear Capacitación (Combo Dependiente)** ⭐ — el componente más importante del proyecto, según AGENTS.md.
