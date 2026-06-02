# F07 - Frontend - Dashboard Personal y Lista de Capacitaciones

**Agente:** builder
**Fecha:** 2026-06-02
**Estado:** done

---

## Objetivo

Reemplazar los placeholders de F05 con un dashboard personal y una lista de capacitaciones funcionales, permitiendo al usuario ver resúmenes, explorar y filtrar capacitaciones, y consultar el detalle de cada una (con registro/desregistro).

---

## Archivos creados

### Tipos y servicios

| Archivo | Propósito |
|---------|-----------|
| `src/types/index.ts` (modificado) | Agregados: `CapacitacionEstado`, `Capacitacion`, `CapacitacionListItem`, `CapacitacionDetalle`, `RegistroCapacitacion`, `CapacitacionConRegistro`, `CapacitacionFiltros`, `AsistenciaPayload` |
| `src/services/capacitaciones.service.ts` | Cliente HTTP: `list`, `getById`, `listByUsuario`, `registrar`, `desregistrar`, `marcarAsistencia` |

### Hooks

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useCapacitaciones.ts` | `useCapacitaciones(filters)`, `useCapacitacion(id)`, `useMisCapacitaciones()`, `useRegistrarmeACapacitacion()`, `useDesregistrarmeDeCapacitacion()`, `useMarcarAsistencia()` |

### Componentes UI base

| Archivo | Propósito |
|---------|-----------|
| `src/components/ui/badge.tsx` | Badge shadcn-style con `cva`. Variantes: `default`, `secondary`, `destructive`, `outline`, `success`, `warning` |

### Componentes de feature

| Archivo | Propósito |
|---------|-----------|
| `src/components/capacitacion/CapacitacionCard.tsx` | Card visual de una capacitación: header con estado, descripción, meta (fecha/hora/duración/cupo), acciones (Ver detalle / Registrarme / Desregistrarme) |
| `src/components/capacitacion/CapacitacionStatusBadge.tsx` | Badge específico para `CapacitacionEstado` con icono (`Clock`/`CheckCircle2`/`XCircle`) |
| `src/components/capacitacion/CapacitacionFilters.tsx` | Filtros de búsqueda (texto, área, estado) con botón limpiar |
| `src/components/capacitacion/EmptyState.tsx` | Estado vacío reutilizable (icono, título, descripción, acción opcional) |

### Rutas

| Archivo | Propósito |
|---------|-----------|
| `src/routes/dashboard.tsx` (modificado) | Dashboard personal: saludo, 4 stat cards, próximas capacitaciones, accesos rápidos |
| `src/routes/capacitaciones/index.tsx` (modificado) | Lista con filtros (servidor + cliente) y grid de cards |
| `src/routes/capacitaciones/$id.tsx` (nuevo) | Detalle de capacitación: header, info grid, capacitador, inscriptos, acción sticky de registrar/desregistrar |

### Archivos modificados (fixes y consistencia)

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/Sidebar.tsx` | `user?.esJefe` (que no existía) → `user?.roles?.includes('jefe_area')` |

---

## Pantallas

### `/dashboard` (DashboardPage)

Estructura:

1. **Header**: saludo `Hola, {nombre} 👋` + subtítulo
2. **4 Stat cards** en grid responsive:
   - Inscripciones totales (icon `GraduationCap`)
   - Próximas activas (icon `Clock`)
   - Completadas (icon `CheckCircle2`)
   - Cupos libres totales (icon `Users`)
3. **Mis próximas capacitaciones**: top 5 (filtradas por fecha >= hoy + estado `programada` + orden por fecha). `EmptyState` con CTA si no hay ninguna.
4. **Accesos rápidos**: cards con link. Muestra "Crear capacitación" y "Mi área" solo si `esJefe()`.

### `/capacitaciones` (CapacitacionesListPage)

Estructura:

1. **Header** con título + botón "Crear capacitación" (solo si es jefe)
2. **`CapacitacionFilters`**: búsqueda por texto (cliente), área y estado (servidor), botón limpiar
3. **Resultados**:
   - Loading: `Loader2` + texto
   - Error: `EmptyState` con mensaje
   - Vacío: `EmptyState` contextual (con o sin filtros)
   - Con datos: contador + grid de `CapacitacionCard` (3 columnas en xl)

Filtros:
- `busqueda` → filter en cliente sobre `nombre` + `descripcion`
- `area_id` y `estado` → se mandan al backend (en la query)

### `/capacitaciones/$id` (CapacitacionDetailPage)

Estructura:

1. **Botón volver** → `/capacitaciones`
2. **Header**: nombre, área (link a `/dashboard/area`? no todavía), `CapacitacionStatusBadge`, descripción
3. **Alert** si falló el register/unregister
4. **4 InfoCells**: Fecha, Horario + duración, Plataforma, Inscriptos (X / Y)
5. **Sección Capacitador**: nombre, email
6. **Sección Inscriptos**: lista con nombre y estado (`Asistió` / `Pendiente`)
7. **Action bar sticky** abajo:
   - Si `isRegistered`: botón "Desinscribirme" (con `window.confirm`)
   - Si no: botón "Registrarme" (deshabilitado si `isFull` o `isCancelled`)
   - Mensaje contextual: cupos libres / completa / ya inscripto

---

## Integración con backend F04

| Endpoint | Frontend hook | Uso |
|----------|---------------|-----|
| `GET /api/capacitaciones?area_id=&estado=&fecha=` | `useCapacitaciones` | Lista con filtros servidor |
| `GET /api/capacitaciones/:id` | `useCapacitacion` | Detalle con area/capacitador/registros |
| `GET /api/usuarios/:id/capacitaciones` | `useMisCapacitaciones` | Dashboard + check de "ya inscripto" |
| `POST /api/capacitaciones/:id/registrar` | `useRegistrarmeACapacitacion` | Botón en detalle |
| `DELETE /api/capacitaciones/:id/registrar/:usuario_id` | `useDesregistrarmeDeCapacitacion` | Botón en detalle |
| `PUT /api/capacitaciones/:id/registrar/:usuario_id/asistencia` | `useMarcarAsistencia` | (preparado para F10, jefe de área) |

### Invalidación de cache

Las mutaciones (`registrar` / `desregistrar` / `marcarAsistencia`) invalidan:
- `['capacitaciones']` (todas las queries que empiecen con eso: lista, detalle, mis)
- `['capacitaciones', 'detalle', id]` (específico del detalle actualizado)
- `['capacitaciones', 'mias']` (para refrescar el dashboard)

Esto garantiza que el dashboard, la lista y el detalle se mantengan sincronizados después de cualquier acción.

---

## Decisiones de diseño

1. **Filtro de búsqueda en cliente, filtros de área/estado en servidor**: el de texto es barato y permite UX instantánea; los de servidor son útiles para reducir el payload y porque la lista puede crecer.
2. **Top 5 en dashboard**: prioriza inmediatez. Si hay más, hay un link "Ver todas" que va a `/capacitaciones`.
3. **Cupos libres como stat**: feedback al usuario de que hay oportunidades para inscribirse (vincula implícitamente a la acción).
4. **`isRegistered` se chequea contra `useMisCapacitaciones`**: dos queries paralelas (detalle + mis caps) — TanStack Query las deduplica si no hay `queryKey` overlap. Decidí no usar `capacitacion.registros.some(...)` porque solo el admin/jefe debería ver la lista de todos; el usuario solo necesita saber si él está inscripto.
5. **`window.confirm` para desregistrar**: simple, no requiere componente `Dialog`. Aceptable para una acción destructiva reversible.
6. **Action bar sticky en detalle**: el botón de acción siempre visible al scrollear, especialmente útil en mobile.
7. **Empty state reutilizable**: 4 lugares lo usan (dashboard sin caps, lista vacía, lista filtrada vacía, detalle no encontrado). Reduce duplicación.
8. **`Badge` con variantes semánticas**: `success` para completada, `warning` para programada, `destructive` para cancelada. Color refuerza el significado.
9. **Filtros disabled mientras fetching**: evita acciones intermedias que podrían invalidar queries en vuelo.
10. **`useNavigate` en lugar de `window.location`**: navegación SPA preserva el state del router.
11. **Mostrar `capacitacion.area.nombre` directamente del backend**: evita una query extra a `/api/areas/:id`. Trade-off: si el área se renombra, el cache queda stale hasta invalidar.

---

## Convenciones respetadas

- **Naming**: PascalCase (componentes), `use*` (hooks), `format*` (helpers), `handle*` (event handlers).
- **Imports**: React → externos → `@/...` → tipos.
- **Sin comentarios** innecesarios.
- **Iconos lucide**: `Calendar`, `Clock`, `Users`, `PlusCircle`, `Loader2`, `Mail`, `Building2`, `Globe`, `ArrowLeft`, `Inbox`, `CheckCircle2`, `XCircle`, `Search`, `GraduationCap`.
- **Tokens de tema** en lugar de colores hardcoded.
- **shadcn-compatible**: `Badge` sigue el patrón estándar con `cva`.
- **Type-safe**: cada `useQuery`/`useMutation` tipado con `CapacitacionListItem[]`, `CapacitacionDetalle`, etc.
- **Accesibilidad**: `aria-hidden` en iconos decorativos, `sr-only` labels en filtros, `aria-label` donde corresponde.
- **a11y**: `select` con `Label` asociado (algunos con `sr-only` para no romper layout), `disabled` en acciones cuando corresponde.

---

## Validación

### Pendiente (requiere `npm install` y backend corriendo)

```bash
cd backend
npm run dev

cd frontend/agenda-frontend
npm install
npm run typecheck
npm run dev
```

### Checklist de F07

- [x] `capacitaciones.service.ts` con 6 métodos
- [x] `useCapacitaciones.ts` con 6 hooks (3 queries + 3 mutations)
- [x] `CapacitacionCard` con header, descripción, meta, acciones
- [x] `CapacitacionStatusBadge` con icono y color semántico
- [x] `CapacitacionFilters` con búsqueda/área/estado
- [x] `EmptyState` reutilizable
- [x] `Badge` shadcn-style con cva
- [x] Dashboard con saludo, 4 stats, próximas caps, accesos rápidos
- [x] Lista con filtros servidor+cliente, grid responsive
- [x] Detalle con info completa, capacitador, inscriptos, action bar sticky
- [x] Fix `Sidebar.esJefe` (pre-existente de F05)
- [x] Invalidación de cache correcta en mutations
- [x] `window.confirm` para desregistrar
- [x] Mensajes de error del backend mostrados
- [x] Botón "Crear capacitación" solo visible para jefes
- [x] Documentación en `progress/impl_f07.md` y `progress/review_f07.md`
- [x] `feature_list.json` y `progress/current.md` actualizados

### Cómo probar el flujo tras `npm install`

1. **Login** con cualquier usuario sembrado en F01 (admin o jefe).
2. **Dashboard**: ver saludo, stats, próximas caps. Si no hay caps inscriptas, ver `EmptyState`.
3. **Click en "Ver detalle"** de una capacitación → ir a `/capacitaciones/:id` con info completa.
4. **Click en "Registrarme"** → ver el botón cambiar a "Desinscribirme" + mensaje de éxito.
5. **Volver a `/capacitaciones`** → ver la capacitación con el contador de inscriptos actualizado.
6. **Filtros**: tipear en "Buscar" para filtrar por nombre. Seleccionar un área → ver resultados.
7. **Click en "Limpiar"** → ver todos los filtros resetearse.
8. **Dashboard como jefe**: ver "Crear capacitación" y "Mi área" en accesos rápidos.
9. **Capacitación cancelada**: el botón de registrar/desregistrar no aparece.
10. **Capacitación llena**: el botón "Registrarme" está disabled con texto "Completa".

---

## Lo que NO está incluido (queda para features futuras)

1. **Edición de capacitación**: solo lectura. F08 cubre el crear; la edición podría entrar en F10.
2. **Búsqueda full-text en backend**: solo se filtra en cliente. Si la lista crece >1000 items, conviene moverlo al backend.
3. **Paginación**: no hay, se asume <1000 items. Si pasa, se puede agregar con `useInfiniteQuery` o paginación clásica.
4. **TanStack Table**: AGENTS.md lo mencionaba, pero opté por grid de cards por mejor UX visual y porque el tamaño esperado es chico. Si se quiere tabla, se puede refactorizar con `@tanstack/react-table`.
5. **Sincronización con Google/Outlook Calendar**: en `/capacitaciones/:id` no hay links a los eventos del calendario. F09 lo agregará.
6. **Marcar asistencia desde el usuario**: solo el jefe de área lo hace (F10).

---

## Próxima feature

**F08 - Frontend - Formulario Crear Capacitación (Combo Dependiente)** ⭐

Es la feature más importante según AGENTS.md. Crear `/capacitaciones/crear` con un formulario completo que tenga:
- `SelectArea` (dropdown de áreas)
- `SelectCapacitador` (combo dependiente que se carga según área seleccionada vía `GET /api/areas/:id/personal`)
- Resto de campos (nombre, descripción, fecha, hora, duración, plataforma, max participantes)
- Validación con zod
- Manejo de errores
