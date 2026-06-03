# F11 - Backend - Dashboard y Reportes

**Estado:** done
**Fecha de implementacion:** 2026-06-02
**Agente:** builder
**Dependencias:** F09 (done), F04 (done), F01 (done), F03 (done)

---

## Resumen

Se implementaron los 2 endpoints de dashboard server-side que agregan datos en el backend, replicando exactamente la forma (shape) de respuesta que los dashboards frontend actuales consumen via agregacion client-side:

- `GET /api/dashboard/area/:id` — Dashboard del jefe de area
- `GET /api/dashboard/usuario` — Dashboard personal del usuario autenticado

Los endpoints son **READ-only** (bajo riesgo), usan `Promise.all` para paralelizar queries, y soportan el control de acceso basado en roles (admin, jefe_area de su propio area) sin necesidad de nuevos permisos en la BD.

---

## Decisiones de diseno

### 1. Matchear el shape actual del frontend (recomendado por el usuario)
La idea es que el frontend pueda migrar a estos endpoints en una iteracion futura sin necesidad de cambiar la UI. Los stat cards y listas que el frontend ya renderiza se mantienen identicos, solo que ahora vienen pre-agregados del servidor.

### 2. Validacion en service, no en middleware
`/api/dashboard/area/:id` requiere una validacion custom (admin OR jefe_area de esa area), no se puede expresar como un simple `requirePermission('X')`. La validacion esta en `ensureCanViewArea(actor, area)` en el service. Esto evita crear permisos nuevos en la BD que solo se usarian para 1 endpoint.

### 3. SQL agregaciones eficientes con subqueries
En vez de cargar todas las capacitaciones y agregarlas en JavaScript, se usan `COUNT(*)`, `SUM()`, y subqueries en SQL. Por ejemplo:
- `inscritos` por cap: subquery `(SELECT COUNT(*)::int FROM registros_capacitacion WHERE capacitacion_id = capacitaciones.id)` directamente en el SELECT
- `cupos_libres` total: `SUM(max_participantes - (subquery count))` en una sola query

Esto es O(1) queries con `Promise.all` para paralelizar, vs O(N) que seria cargar todo y agregar client-side.

### 4. PostgreSQL bigint -> string handling
Por defecto, `postgres.js` (driver de Drizzle) devuelve `COUNT(*)` y `SUM()` como `string` porque PostgreSQL retorna `bigint` (no `int`). Para evitar esto y devolver numeros nativos JSON, se castean explicitamente: `COUNT(*)::int` y `SUM(...)::int`. Esto fue detectado en los smoke tests y arreglado.

### 5. Response shape segun los stat cards del frontend

**`GET /api/dashboard/area/:id`**:
```json
{
  "success": true,
  "data": {
    "area": { "id": 1, "nombre": "Desarrollo", "descripcion": "...", "jefe_id": 1 },
    "stats": {
      "personas_total": 29,
      "capacitadores": 6,
      "caps_programadas": 3,
      "inscriptos_total": 7
    },
    "capacitaciones": {
      "futuras": [...],     // programa + fecha >= today
      "realizadas": [...],  // programa + fecha < today (aun no cerradas)
      "cerradas": [...]     // completada OR cancelada
    }
  }
}
```

**`GET /api/dashboard/usuario`**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "inscripciones_totales": 2,
      "proximas_activas": 1,
      "completadas": 0,
      "cupos_libres": 99
    },
    "mis_proximas_capacitaciones": [...]  // top 5 sorted
  }
}
```

### 6. No migrar frontend (recomendado por el usuario)
El frontend sigue usando su agregacion client-side actual. Los nuevos endpoints existen como API paralela, listos para una migracion futura. Esto minimizo el scope de F11 y elimino riesgo de regresion en la UI.

### 7. Sin nuevos permisos en BD
Se usan permisos existentes (`capacitacion:ver` para todo lo basico) y validacion custom en service para la logica de "jefe solo de su area". Esto evita inflar la tabla `permisos` con codigos que solo se usarian en 1 endpoint.

---

## Artefactos creados

### 1. Service
**`backend/src/services/dashboard.service.js`** (NEW, ~230 lineas)

Funciones exportadas:
- `getAreaDashboard(areaId, actor)` — retorna `{ area, stats, capacitaciones: { futuras, realizadas, cerradas } }`
- `getUsuarioDashboard(actor)` — retorna `{ stats, mis_proximas_capacitaciones }`

Funciones internas:
- `countPersonal(areaId)` — count de usuarios activos en el area
- `countCapacitadores(areaId)` — count DISTINCT de usuarios con rol capacitador/jefe_area/admin en el area
- `countCapsByState(areaId)` — group by estado, devuelve map `{programada, completada, cancelada}`
- `countInscritosTotal(areaId)` — count de registros del area (sumando todas las caps)
- `listCapsForArea(areaId, { estado, fechaGte, fechaLt })` — SELECT con subquery para `inscritos`
- `listMisProximas(usuarioId, limit)` — top N caps futuras del usuario
- `countInscripcionesByState(usuarioId)` — group by estado
- `countProximasActivas(usuarioId)` — count where programada + fecha >= today
- `sumCuposLibres()` — SUM global de cupos libres en caps futuras
- `ensureCanViewArea(actor, area)` — RBAC: admin o jefe_area del area

### 2. Controller
**`backend/src/controllers/dashboardController.js`** (NEW, 38 lineas)

- `area(req, res)` — handler de GET /area/:id, valida param con Zod
- `usuario(req, res)` — handler de GET /usuario
- `handleError` estandar (mismo patron que controllers existentes)

### 3. Routes
**`backend/src/routes/dashboard.js`** (NEW, 11 lineas)

- `router.use(auth)` — requiere JWT
- `GET /area/:id` → `area`
- `GET /usuario` → `usuario`

### 4. App
**`backend/src/app.js`** (MODIFIED)

- Agregado `import dashboardRoutes from './routes/dashboard.js'`
- Agregado `app.use('/api/dashboard', dashboardRoutes)`

---

## Smoke tests ejecutados (12/12 pasaron)

| Test | HTTP | Resultado |
|---|---|---|
| `GET /api/dashboard/usuario` sin token | 401 | OK (middleware auth) |
| `GET /api/dashboard/area/1` sin token | 401 | OK |
| Juan (jefe Desarrollo) → `GET /area/1` (su area) | 200 | Stats correctas: 29/6/3/7 |
| Juan → `GET /area/2` (NO su area) | 403 | "Solo el jefe del area o un administrador" |
| Juan → `GET /area/999` (no existe) | 404 | "Area no encontrada" |
| Luis (jefe Operaciones) → `GET /area/2` (su area) | 200 | OK |
| Luis → `GET /area/1` (NO su area) | 403 | OK |
| Carlos (usuario regular) → `GET /area/1` | 403 | OK (no es jefe) |
| Juan → `GET /usuario` | 200 | Stats correctas: 0/0/0/85 |
| Carlos → `GET /usuario` | 200 | OK |
| `GET /area/abc` (id invalido) | 400 | "Datos invalidos" |
| Carlos registra a cap futura + re-check `/usuario` | 200 | inscripciones_totales: 1→2, proximas_activas: 0→1, mis_proximas: 1 entry con registered_en |

**Response shape validado**: `inscritos` es `Number` (no string), `area` con sus campos basicos, `stats` con 4 keys exactas, `capacitaciones` agrupadas en 3 keys.

**Data flow validado**: registrar a una cap futura cambia `inscripciones_totales`, `proximas_activas`, y aparece en `mis_proximas_capacitaciones` con `registrado_en` timestamp.

---

## Archivos modificados/creados (resumen)

```
backend/
  src/services/dashboard.service.js     [NEW, ~230 lineas]
  src/controllers/dashboardController.js [NEW, 38 lineas]
  src/routes/dashboard.js               [NEW, 11 lineas]
  src/app.js                            [MODIFIED: +2 lines]
```

Total: **3 archivos nuevos, 1 archivo modificado**.

---

## Observaciones / Limitaciones

1. **Sin paginacion en `/usuario`**: `mis_proximas_capacitaciones` esta hardcodeado a top 5. Esto matchea el frontend actual. Si se quiere paginar, agregar query param `?limit=N`.

2. **Sin cache**: cada request ejecuta todas las queries. Para volumenes altos, agregar cache con TTL (e.g., `node-cache` o Redis). Aceptable para el alcance de F11 (~100 usuarios).

3. **Sin auditoria/reportes en este scope**: por decision del usuario, "reportes de asistencia" y "logs de auditoria" van a features separadas. La tabla `auditoria_roles` ya existe y podria alimentar un futuro `GET /api/auditoria/roles`.

4. **`cupos_libres` es global, no por area**: cuenta TODAS las caps futuras del sistema, no solo del area. Esto matchea el frontend actual (`useCapacitaciones({ estado: 'programada' })` sin filtro de area). Si se quiere por area, agregar filtro `eq(areaId, ...)`.

5. **Sin tests automatizados**: F11 no tiene tests unitarios (se aplicaran en F12 - Testing y QA). Los smoke tests manuales confirman correctness.

6. **N+1 potencial en caps grouped queries**: `listCapsForArea` se llama 3 veces (futuras, realizadas, cerradas). Para volumenes pequenos (<100 caps/area) no es problema. Si crece, podria consolidarse en 1 query con sort y particion client-side.

7. **El frontend NO consume estos endpoints todavia**: el user decidio no migrar en F11. La migracion es scope de feature futura (e.g., F14 frontend polish).

---

## Proximos pasos sugeridos

- **F12 - Testing y QA**: tests unitarios del service con mocks, tests de integracion con supertest, tests e2e con Playwright en el frontend.
- **Frontend migration (futuro)**: cambiar `dashboard.area.tsx` y `dashboard.index.tsx` para usar los nuevos endpoints. Requiere crear hooks `useAreaDashboard(areaId)` y `useUsuarioDashboard()` en `useCapacitaciones.ts` o nuevo `useDashboard.ts`.
- **Reportes de asistencia (futuro)**: `GET /api/reportes/asistencia?area_id=X&desde=Y&hasta=Z` para exportar a CSV/Excel.
- **Auditoria de roles (futuro)**: `GET /api/auditoria/roles` listando cambios desde la tabla `auditoria_roles` (ya existe).
