# F11 - Backend - Dashboard y Reportes - Review

**Estado:** done
**Fecha de revision:** 2026-06-02
**Reviewer:** reviewer
**Feature:** F11 - Backend - Dashboard y Reportes
**Implementador:** builder
**Documento de impl:** `progress/impl_f11.md`

---

## Resumen

F11 fue implementada y aprobada. Se entregaron los 2 endpoints de dashboard server-side que replican exactamente la forma (shape) de los stat cards y listas que los dashboards frontend actuales renderizan via agregacion client-side. Los endpoints son READ-only, paralelos (Promise.all), y con control de acceso basado en roles validado en service (no en middleware, no en tabla de permisos).

El scope se mantuvo limitado (sin reportes de asistencia, sin auditoria) segun decision del usuario. Esos features quedan como trabajo futuro.

---

## Validacion contra CHECKPOINTS

### 1. Endpoint `GET /api/dashboard/area/:id`

| Criterio | Resultado | Notas |
|---|---|---|
| Implementado segun feature_list.json | PASS | `backend/src/routes/dashboard.js:8` |
| Retorna shape compatible con `dashboard.area.tsx` | PASS | 4 stat cards + 3 grupos de caps (futuras/realizadas/cerradas) |
| `stats.personas_total` (count usuarios activos del area) | PASS | SQL `COUNT(*)` con `WHERE area_id=? AND activo=true` |
| `stats.capacitadores` (count con rol capacitador/jefe_area/admin) | PASS | SQL `COUNT(DISTINCT usuarios.id)` con join a usuarios_roles/roles |
| `stats.caps_programadas` (count de caps en estado 'programada') | PASS | `GROUP BY estado` |
| `stats.inscriptos_total` (sum de registros en caps del area) | PASS | `COUNT(registros)` con join a capacitaciones |
| `capacitaciones.futuras` (programada + fecha >= today) | PASS | Filtro `WHERE estado='programada' AND fecha >= today` |
| `capacitaciones.realizadas` (programada + fecha < today) | PASS | Filtro inverso, aun no cerradas |
| `capacitaciones.cerradas` (completada OR cancelada) | PASS | Filter client-side post-query |
| Cada cap tiene `inscritos` populados | PASS | Subquery `(SELECT COUNT(*)::int FROM registros_capacitacion WHERE capacitacion_id=capacitaciones.id)` en SELECT |
| `inscritos` es Number, no string | PASS | Cast a `::int` en SQL para evitar el bigint->string default de postgres.js |
| Auth requerida (JWT) | PASS | `router.use(auth)` |
| RBAC: admin puede ver cualquier area | PASS | `ensureCanViewArea` valida `roles.includes('admin')` |
| RBAC: jefe_area solo su propio area | PASS | `roles.includes('jefe_area') && actor.area_id === area.id` |
| RBAC: usuario regular -> 403 | PASS | Test con carlos.lopez confirmo 403 |
| 404 si area no existe | PASS | Test con /area/999 confirmo 404 |
| 400 si id invalido | PASS | Zod `idSchema.coerce.number().int().positive()` |

### 2. Endpoint `GET /api/dashboard/usuario`

| Criterio | Resultado | Notas |
|---|---|---|
| Implementado segun feature_list.json | PASS | `backend/src/routes/dashboard.js:9` |
| Retorna shape compatible con `dashboard.index.tsx` | PASS | 4 stat cards + lista de mis_proximas_capacitaciones |
| `stats.inscripciones_totales` (count de registros del user) | PASS | `GROUP BY estado` + suma |
| `stats.proximas_activas` (programada + fecha >= today) | PASS | `WHERE estado='programada' AND fecha >= today` |
| `stats.completadas` (count con estado='completada') | PASS | Del GROUP BY estado |
| `stats.cupos_libres` (sum de max - inscritos para caps futuras) | PASS | `SUM(max_participantes - subquery)::int` |
| `mis_proximas_capacitaciones` (top 5 sorted) | PASS | `ORDER BY fecha, hora_inicio LIMIT 5` |
| Cada cap en mis_proximas incluye `registrado_en` | PASS | Join a registros_capacitacion |
| Auth requerida (JWT) | PASS | `router.use(auth)` |
| No requiere permiso especifico (cualquier user autenticado) | PASS | Logica de service no valida roles |

### 3. SQL Aggregations

| Criterio | Resultado | Notas |
|---|---|---|
| Uso de `count()` de drizzle para counts simples | PASS | `countPersonal`, `countInscritosTotal`, `countProximasActivas` |
| Uso de `sql` template para agregaciones custom | PASS | `countCapacitadores` (DISTINCT), `sumCuposLibres` (SUM) |
| Subqueries en SELECT para campos calculados | PASS | `inscritos` en `listCapsForArea` |
| `Promise.all` para paralelizar queries | PASS | `getAreaDashboard`: 7 queries en paralelo, `getUsuarioDashboard`: 4 queries |
| Casts a `int` para evitar bigint->string | PASS | `::int` en subqueries y SUM |
| `GROUP BY estado` para breakdowns | PASS | `countCapsByState`, `countInscripcionesByState` |

### 4. Code Quality

| Criterio | Resultado | Notas |
|---|---|---|
| ES modules consistentes | PASS | Todo `import/export` |
| Errores con `statusCode` property | PASS | Service lanza `new Error(msg); error.statusCode = 4xx` |
| `handleError` estandar en controller | PASS | Mismo patron que otros controllers |
| Validacion con Zod en controller | PASS | `idSchema` para param, no body |
| Mensajes en espanol | PASS | "Area no encontrada", "Solo el jefe del area..." |
| Sin comentarios innecesarios | PASS | Solo headers de funciones |
| Helpers privados abajo de helpers publicos | PASS | `countPersonal`, etc. antes de `getAreaDashboard` |

### 5. Smoke Tests (12/12 pasaron)

| Test | HTTP | Resultado |
|---|---|---|
| `GET /api/dashboard/usuario` sin token | 401 | OK |
| `GET /api/dashboard/area/1` sin token | 401 | OK |
| Juan (jefe Desarrollo) → `/area/1` (su area) | 200 | stats: 29/6/3/7, caps: 3 futuras + 3 cerradas |
| Juan → `/area/2` (NO su area) | 403 | "Solo el jefe del area o un administrador" |
| Juan → `/area/999` (no existe) | 404 | "Area no encontrada" |
| Luis (jefe Operaciones) → `/area/2` (su area) | 200 | OK |
| Luis → `/area/1` (NO su area) | 403 | OK |
| Carlos (usuario regular) → `/area/1` | 403 | OK |
| Juan → `/usuario` | 200 | stats: 0/0/0/85 |
| Carlos → `/usuario` | 200 | OK |
| `GET /area/abc` (id invalido) | 400 | "Datos invalidos" |
| Carlos registra a cap futura + re-check `/usuario` | 200 | inscripciones_totales: 1→2, proximas_activas: 0→1, mis_proximas: 1 entry |

**Data flow validado**: registrar a una cap futura cambia `inscripciones_totales`, `proximas_activas`, y aparece en `mis_proximas_capacitaciones` con `registrado_en` timestamp. Esto confirma que las queries se ejecutan en tiempo real y reflejan el estado actual de la BD.

---

## Observaciones / Limitaciones (esperadas, no bloquean)

1. **Sin paginacion en `/usuario`**: `mis_proximas_capacitaciones` hardcodeado a top 5. Matchea frontend actual. Documentado como follow-up.

2. **Sin cache**: cada request ejecuta todas las queries. Aceptable para 100 usuarios. Documentado como follow-up.

3. **`cupos_libres` es global, no por area**: matchea el frontend actual que tampoco filtra por area. Documentado como follow-up.

4. **Sin tests automatizados**: F12 (Testing y QA) los agregara. Smoke tests manuales confirman correctness.

5. **Frontend NO migrado**: el user decidio no migrar en F11. Los endpoints existen como API paralela. Migracion es feature futura.

6. **Sin auditoria/reportes**: por decision del usuario, scope acotado a los 2 endpoints del `feature_list.json`. La tabla `auditoria_roles` existe y podria alimentar un futuro endpoint.

7. **LSP errors pre-existentes** en `schema.ts` (recursive Drizzle types) y archivos F10 refactorizados (cache stale). No son bloqueantes.

---

## Decisiones arquitectonicas validadas

- **Validacion en service, no en middleware**: la regla "jefe_area solo de su propio area" no se puede expresar como un simple `requirePermission`. Service es el lugar correcto.
- **Sin nuevos permisos en BD**: usar permisos existentes (`capacitacion:ver`) + validacion custom evita inflar la tabla `permisos` con codigos one-off.
- **SQL aggregations sobre client-side**: `COUNT`, `SUM`, subqueries en `SELECT` son O(1) queries vs O(N) que seria cargar todo y agregar en JavaScript.
- **`Promise.all` para paralelizar**: 7 queries en `getAreaDashboard` corren en paralelo, latencia = max(query) en vez de sum(query).
- **Matchear shape actual del frontend**: permite migracion futura sin UI changes, minimiza scope, reduce riesgo.
- **Bigint->string handling**: cast a `::int` detectado y arreglado en smoke tests. Es un patron conocido en postgres.js.

---

## Conclusion

F11 cumple con todos los criterios del checkpoint y de la documentacion (`AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`).

**Aprobada para cierre.** Endpoints listos para uso. La migracion del frontend queda como feature futura.

Feature list actualizado: `completed: 11 → 12`, `pending: 3 → 2`.

### Proximo Paso

**F12 - Testing y QA** (prioridad: high, dependencias: F10, F11 done). El siguiente paso logico es agregar tests automatizados para evitar regresiones despues de F09/F11:
- Tests unitarios del service con mocks (vitest/jest)
- Tests de integracion con supertest (endpoints completos)
- Tests e2e con Playwright en el frontend

Es importante hacerlo ANTES de F13 (Deployment) para tener confianza en CI/CD.

Alternativa: **F13 - Deployment** (prioridad: medium, dependencias: F12). Empezar configuracion del VPS, pero sin tests seria riesgoso.

### Lecciones aprendidas

- **postgres.js retorna bigint como string por default** — siempre castear a `::int` o `::text` segun el caso de uso. Patron a aplicar en futuros services.
- **Smoke tests manuales con curl** son valiosos pero no escalables — F12 los reemplazara con automatizados.
- **Custom RBAC en service** es valido cuando la regla no se puede expresar como un `requirePermission` simple. No se debe abusar de la tabla `permisos`.
- **Matchear shape del frontend** permite migracion sin UI changes. Es un buen principio para evitar refactors en cascada.
