# Historial del Proyecto

## [2026-05-20] Inicio del Proyecto

**Feature:** F00 - Setup Inicial y Arquitectura Harness
**Status:** En progreso
**Builder:** Claude Sonnet

### Acciones Realizadas

1. **Creación de Arquitectura Harness Subagentes:**
   - Archivo AGENTS.md con mapa completo de fases
   - Definiciones de 3 roles: orchestrator, builder, reviewer
   - Sistema de estado persistente en progress/

2. **Definición de Features:**
   - feature_list.json con 14 features del proyecto
   - Dependencias entre features claramente definidas
   - Metadata de estimaciones y prioridades

3. **Criterios de Validación:**
   - CHECKPOINTS.md con criterios para cada feature
   - Ejemplos de validación y comandos de verificación
   - Formato estándar de revisión

4. **Documentación Técnica:**
   - docs/ARCHITECTURE.md - Arquitectura completa del sistema
   - docs/CONVENTIONS.md - Convenciones de código
   - docs/VERIFICATION.md - Guía de verificación

5. **Definición de Agentes:**
   - .claude/agents/orchestrator.md - Rol de coordinación
   - .claude/agents/builder.md - Rol de implementación
   - .claude/agents/reviewer.md - Rol de validación

### Decisiones Arquitectónicas

1. **Patrón Harness Engineering:** Adoptado del repositorio ejemplo-harness-subagentes
2. **Estado en Disco:** Todo el estado vive en archivos versionados
3. **Validación Estricta:** 100% de checkpoints deben pasar
4. **Documentación Sincronizada:** Código y documentación evolucionan juntos

### Próximos Pasos

- Completar archivos de configuración (README.md, .env.example)
- Ejecutar init.sh para verificar estructura
- Marcar F00 como done
- Comenzar F01: Base de Datos

---

## [2026-05-20] Feature F01 - Implementación Completada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** Implementado, pendiente de revisión
**Builder:** Claude Sonnet 4.5
**Duración:** 2 horas

### Resumen

Se implementó el schema completo de la base de datos con Drizzle ORM:

**Archivos creados:**
- `backend/drizzle.config.ts` - Configuración Drizzle
- `backend/src/db/schema.ts` - 9 tablas + relaciones + types
- `backend/src/db/index.ts` - Conexión PostgreSQL
- `backend/src/db/seed.ts` - Datos de semilla
- `backend/src/db/migrations/0000_medical_gamora.sql` - Migración inicial
- `backend/.env` - Variables de entorno
- `progress/impl_f01.md` - Documentación completa

**Tablas implementadas (9):**
1. areas (4 áreas)
2. usuarios (14 usuarios seed)
3. capacitaciones (3 capacitaciones seed)
4. registros_capacitacion (M2M)
5. roles (4 roles)
6. permisos (15 permisos)
7. role_permisos (M2M)
8. usuarios_roles (M2M)
9. auditoria_roles

**Dependencias instaladas:**
- drizzle-orm v0.45.2
- postgres v3.4.9
- drizzle-kit v0.31.10 (dev)
- tsx v4.22.3 (dev)

**Scripts agregados:**
- `npm run db:generate` - Generar migraciones
- `npm run db:migrate` - Aplicar migraciones
- `npm run db:push` - Push directo a BD
- `npm run db:studio` - Drizzle Studio UI
- `npm run db:seed` - Ejecutar seed

### Decisiones Arquitectónicas

1. **Drizzle ORM:** Elegido por type-safety, performance y migraciones automáticas
2. **ES Modules:** Cambiado `package.json` a `"type": "module"`
3. **Sistema RBAC:** 4 tablas para control granular de permisos
4. **Relaciones explícitas:** Todas definidas con `relations()` para queries relacionales

### Puntos Críticos Implementados

✅ `area_id` en usuarios (crucial para F03 y F08)
✅ UNIQUE constraint en registros_capacitacion
✅ Campos OAuth (google_id, outlook_id) para F09
✅ Campos event_ids en capacitaciones para F09
✅ Sistema RBAC completo

### Datos de Seed

- 4 áreas (Desarrollo, Operaciones, QA, Product Manager)
- 14 usuarios distribuidos en áreas
- 4 roles con jerarquía (usuario, capacitador, jefe_area, admin)
- 15 permisos granulares
- 3 capacitaciones de ejemplo
- Jefes asignados a cada área

### Pendiente

⏳ Usuario debe ejecutar migraciones y seed
⏳ Reviewer debe validar contra CHECKPOINTS.md
⏳ Aprobar feature para continuar con F02

### Notas Importantes

⚠️ Contraseñas en seed están en texto plano (`password123`)
→ Se hashearán con bcrypt en F02

⚠️ `.env` creado con credenciales por defecto
→ Usuario debe ajustar según su configuración PostgreSQL

---

## Template para Futuras Entradas

```markdown
## [YYYY-MM-DD] Feature FXX Completada

**Feature:** FXX - Nombre
**Duración:** X semanas
**Builder:** Nombre
**Reviewer:** Nombre

**Resumen:**
- Descripción breve de lo implementado

**Archivos creados:**
- archivo1.js
- archivo2.tsx

**Lecciones aprendidas:**
- Lección 1
- Lección 2

**Problemas encontrados:**
- Problema 1 y cómo se resolvió
```

---

**Última actualización:** 2026-05-20

---

## [2026-06-01] Feature F01 - Revision Retomada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** Implementacion corregida, pendiente por credenciales de PostgreSQL
**Reviewer:** Codex

### Acciones Realizadas

1. Se reviso `CHECKPOINTS.md` para F01.
2. Se verifico que `backend/src/db/schema.ts` define las 9 tablas requeridas.
3. Se verifico la migracion inicial `backend/src/db/migrations/0000_medical_gamora.sql`.
4. Se ejecuto `npm run db:generate` con resultado exitoso.
5. Se corrigio `backend/src/db/seed.ts` para usar `eq(...)` en las actualizaciones de jefes de area.
6. Se creo `progress/review_f01.md`.

### Bloqueador

`npm run db:migrate` y `npm run db:seed` no pudieron completarse porque `backend/.env` usa:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/capacitaciones
```

PostgreSQL local esta corriendo, pero rechaza esa clave para el usuario `postgres`.

### Proximo Paso

Actualizar `backend/.env` con una `DATABASE_URL` valida y repetir:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## [2026-06-01] Feature F01 - Aprobada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** done
**Reviewer:** Codex

### Acciones Realizadas

1. Se ejecuto `npm run db:migrate` correctamente.
2. Se ajusto `backend/src/db/seed.ts` para hacerlo idempotente.
3. Se ejecuto `npm run db:seed` correctamente.
4. Se validaron conteos SQL contra PostgreSQL local.
5. Se actualizo `progress/review_f01.md` con veredicto aprobado.
6. Se marco F01 como `done` en `feature_list.json`.

### Validaciones SQL

```text
areas: 4
usuarios: 14
roles: 4
permisos: 15
role_permisos: 32
usuarios_roles: 14
capacitaciones: 3
```

### Proximo Paso

Iniciar F02: Backend - Autenticacion JWT + OAuth.

---

## [2026-06-01] Feature F02 - Aprobada

**Feature:** F02 - Backend Autenticacion JWT + OAuth
**Status:** done
**Builder/Reviewer:** Codex

### Acciones Realizadas

1. Se creo la app Express base (`src/app.js`, `src/server.js`).
2. Se implementaron rutas, controlador, servicio y middleware de autenticacion.
3. Se instalaron `bcryptjs`, `jsonwebtoken`, `zod` y `cors`.
4. Se configuraron variables JWT en `backend/.env`.
5. Se agrego `GET /api/auth/me` para validar el middleware JWT.
6. Se ejecuto smoke test completo con registro, login, refresh, OAuth y usuario seed.
7. Se marco F02 como `done` en `feature_list.json`.

### Verificacion

```text
health: 200
register: 201
duplicate: 409
login: 200
me: 200
refresh: 200
google: 200
outlook: 200
seedLogin: 200
```

### Proximo Paso

Iniciar F03: Backend - CRUD Areas y Usuarios, incluyendo el endpoint critico `GET /api/areas/:id/personal`.

---

## [2026-06-01] Feature F03 - Aprobada

**Feature:** F03 - Backend CRUD Areas y Usuarios
**Status:** done
**Builder/Reviewer:** Codex

### Acciones Realizadas

1. Se implemento middleware RBAC con permisos desde BD.
2. Se implementaron servicios, controladores y rutas para areas.
3. Se implementaron servicios, controladores y rutas para usuarios.
4. Se agrego el endpoint critico `GET /api/areas/:id/personal`.
5. Se agregaron validaciones Zod.
6. Se ejecuto smoke test completo incluyendo RBAC 403 y validaciones 400.
7. Se marco F03 como `done` en `feature_list.json`.

### Verificacion

```text
loginJefe: 200
areasList: 200
areaShow: 200
personal: 200
usuariosList: 200
usuarioShow: 200
usuarioUpdate: 200
invalidUsuario: 400
rbacForbidden: 403
createAreaAdmin: 201
updateAreaAdmin: 200
invalidArea: 400
```

### Proximo Paso

Iniciar F04: Backend - CRUD Capacitaciones y Registros.

---

## [2026-06-01] Feature F04 - Aprobada

**Feature:** F04 - Backend CRUD Capacitaciones y Registros
**Status:** done
**Builder/Reviewer:** Codex

### Acciones Realizadas

1. Se implemento servicio, controlador y rutas de capacitaciones.
2. Se implementaron registros, desregistro y asistencia.
3. Se agregaron endpoints derivados por area y usuario.
4. Se validaron reglas de negocio: fecha, cupo, duplicados, area del capacitador y cancelacion.
5. Se ejecuto smoke test completo.
6. Se marco F04 como `done` en `feature_list.json`.

### Verificacion

```text
createCap: 201
invalidCap: 400
listCaps: 200
showCap: 200
byArea: 200
updateCap: 200
registerCap: 201
duplicateReg: 409
asistencia: 200
byUsuario: 200
unregister: 200
cancelCap: 200
regCancelled: 400
ownerUpdate: 200
capacity: sexto registro 409
```

### Proximo Paso

Iniciar F05: Frontend - Setup, Router y Layout.

---

## [2026-06-01] Feature F05 - Aprobada

**Feature:** F05 - Frontend Setup, Router y Layout
**Status:** done
**Builder/Reviewer:** Codex

### Acciones Realizadas

1. Se inicializo proyecto Vite con React 19 + TS 5.7.
2. Se configuro TanStack Router file-based + TanStack Query.
3. Se crearon stores con Zustand (auth persistido en localStorage).
4. Se implemento AppLayout con Navbar, Sidebar y Footer.
5. Se creo stub de `progress/fix_f05_shadcn.md` para el fix de dependencias shadcn.

### Proximo Paso

Iniciar F06: Frontend - Autenticacion (login, registro, callbacks OAuth).

---

## [2026-06-02] Feature F06 - Aprobada

**Feature:** F06 - Frontend Autenticacion
**Status:** done
**Builder/Reviewer:** Claude Sonnet (M3)

### Acciones Realizadas

1. Paginas de login y register con shadcn/ui.
2. Hooks `useLogin`, `useRegister`, `useLogout`.
3. Páginas stub para callbacks de Google y Outlook.
4. Deteccion y mostrado de errores de campos del backend.

### Proximo Paso

Iniciar F07: Frontend - Dashboard Personal y Lista de Capacitaciones.

---

## [2026-06-02] Feature F07 - Aprobada

**Feature:** F07 - Frontend - Dashboard Personal y Lista de Capacitaciones
**Status:** done
**Builder/Reviewer:** Claude Sonnet (M3)

### Acciones Realizadas

1. Service `capacitaciones.service.ts` con 6 metodos HTTP.
2. Hooks `useCapacitaciones`, `useCapacitacion`, `useMisCapacitaciones` + mutations.
3. Componentes `CapacitacionCard`, `CapacitacionStatusBadge`, `CapacitacionFilters`, `EmptyState`.
4. UI base `Badge` shadcn-style con cva.
5. Dashboard personal con saludo, 4 stat cards, proximas caps, accesos rapidos condicionales.
6. Lista de capacitaciones con filtros servidor+cliente y grid de cards.
7. Detalle `$id.tsx` con info, capacitador, inscriptos, action bar sticky.
8. Fix en `Sidebar.tsx` (`user?.esJefe` → `user?.roles?.includes('jefe_area')`).

### Proximo Paso

Iniciar F08: Frontend - Formulario Crear Capacitacion (Combo Dependiente) - feature critica segun AGENTS.md.

---

## [2026-06-02] Hotfix - Register form no se renderizaba

**ID:** fix_register_areas_401
**Status:** done
**Builder/Reviewer:** Claude Sonnet (M3)

### Problema

El usuario reporto: "despues de registrar, redirige a /login". Al validar en navegador se descubrio que el form de `/register` nunca se renderizaba. La causa real: `useAreas()` dispara `GET /api/areas` sin token, el backend tenia `router.use(auth)` global y devolvia 401, el interceptor disparaba `auth:logout`, el listener en `__root.tsx` navegaba a `/login`.

### Cambios

- `backend/src/routes/areas.js`: `GET /` ahora publico, auth por ruta individual
- `frontend/agenda-frontend/src/lib/api.ts`: 401 handler no despacha `auth:logout` si `isAuthenticated` era `false`
- `progress/fix_register_areas_401.md`: documentacion completa

### Verificacion (navegador)

- Login `juan.perez@empresa.com` / `password123` → /dashboard OK
- Logout → /login OK
- GET `/register` → form visible con 5 areas en dropdown
- Submit register (`browser.test@empresa.com`, area `Desarrollo`) → usuario creado (id=63), /dashboard con saludo "Hola, Browser 👋"
- Logout, login, /capacitaciones → 5 caps con filtros OK

### Lecciones

- `router.use(auth)` global bloquea endpoints que deberian ser publicos
- Un 401 no siempre significa "sesion expirada"
- Validar el reporte del usuario con navegador, no solo por lectura de codigo

### Proximo Paso

Iniciar F08: Frontend - Formulario Crear Capacitacion (Combo Dependiente).

---

## [2026-06-02] Feature F08 - Aprobada

**Feature:** F08 - Frontend - Formulario Crear Capacitacion (Combo Dependiente)
**Status:** done
**Builder/Reviewer:** Claude Sonnet (M3)

### Acciones Realizadas

1. **Extension de types**: agregados `PersonalArea` y `CapacitacionCreatePayload` en `types/index.ts`.
2. **Nuevo service**: `areas.service.ts` con `list()` y `getPersonal(areaId)`.
3. **Extension de hook**: `usePersonalArea(areaId)` agregado a `useAreas.ts` con `enabled: areaId > 0` (combo dependiente).
4. **Extension de service**: `capacitaciones.service.ts` agrego metodo `create(payload)`.
5. **Extension de hook**: `useCreateCapacitacion()` agregado a `useCapacitaciones.ts` con invalidacion de `KEY_ALL` y `KEY_MIAS` en `onSuccess`.
6. **Componentes nuevos**:
   - `SelectArea.tsx` - dropdown controlado con icono `Building2`
   - `SelectCapacitador.tsx` - **combo dependiente** con 5 estados visuales (no area, loading, empty, error, selected) y filtrado por roles `capacitador`/`jefe_area`/`admin`
   - `CapacitacionForm.tsx` - form completo con zod, 9 campos, iconos semanticos, pre-relleno del area del usuario, reset automatico del capacitador al cambiar area
7. **Reemplazo de ruta**: `routes/capacitaciones/crear.tsx` con RBAC (`beforeLoad` para `jefe_area`/`admin`), header con breadcrumb, y success card post-creacion con 3 acciones (Ver detalle, Crear otra, Volver al listado).

### Verificacion (navegador)

15/15 smoke tests pasaron:
- Login juan.perez (jefe_area) → sidebar muestra "Crear Capacitacion"
- GET `/capacitaciones/crear` → form con area=Desarrollo pre-rellenado, 5 areas en dropdown, 6 capacitadores de Desarrollo
- Cambio de area QA → capacitador resetea, fetchea personal, muestra solo Laura/Pedro
- Submit con form vacio → 4 errores inline con `aria-invalid`
- Submit con datos validos → POST 201, capacitacion id=6 creada
- Success card → "Capacitacion creada" + 3 acciones
- "Ver detalle" → navega a `/capacitaciones/6` con todos los datos correctos
- Logout + login browser.test (rol usuario) → sidebar solo 2 items
- Intento de GET `/capacitaciones/crear` como no-jefe → redirect a `/dashboard`

### Decisiones

- **Patron useState + zod** (no react-hook-form): consistente con F06
- **Componentes controlados** (`value` + `onChange`): permite coordinacion area/capacitador
- **Default inteligente**: pre-rellena `area_id` con el area del usuario
- **Reset automatico**: cambiar area limpia el capacitador
- **5 estados visuales en SelectCapacitador**: feedback claro en cada caso
- **Email del capacitador en verde**: confirmacion visual bajo el select

### Lecciones

- El `enabled` flag de TanStack Query es la pieza clave del combo dependiente
- Validar rol en `beforeLoad` evita render + redirect (mejor UX, sin flicker)
- chrome-devtools `click` no siempre dispara `onSubmit`; workaround: `submitBtn.click()` via `evaluate_script`

### Proximo Paso

Iniciar F09: Backend - Integraciones Externas (Google Calendar + Microsoft Graph + Email), o alternativamente F10: Frontend - Dashboard Jefe de Area.

---

## [2026-06-02] Feature F10 - Aprobada

**Feature:** F10 - Frontend - Dashboard Jefe de Area
**Status:** done
**Builder/Reviewer:** Claude Sonnet (M3)

### Acciones Realizadas

1. **Refactor de rutas a layouts anidados**:
   - `routes/dashboard.tsx` → layout (solo `<Outlet />`) + nueva `routes/dashboard.index.tsx` con el dashboard personal previo
   - `routes/capacitaciones/$id.tsx` → layout (solo `<Outlet />`) + nueva `routes/capacitaciones/$id.index.tsx` con el detail page previo
   - Esto permitio que `routes/dashboard.area.tsx` y `routes/capacitaciones/$id/asistencia.tsx` se monten como rutas hijas/standalone segun corresponda
2. **Componentes nuevos**:
   - `PersonalTable.tsx`: tabla con busqueda cliente, 4 columnas, badges por rol (Admin/Jefe/Capacitador/Usuario), skeleton loading, footer con "Mostrando N de M personas"
   - `AsistenciaList.tsx`: componente presentacional reutilizable, soporta modo read-only, dirty tracking con badge "Sin guardar", botones "Asistio" / "No asistio" / "Nota" (expandible a textarea)
3. **Paginas nuevas/refactorizadas**:
   - `routes/dashboard.area.tsx`: 4 stat cards (Personas / Capacitadores / Caps activas / Inscriptos), PersonalTable, capacitaciones agrupadas (Proximas/Realizadas/Cerradas), RBAC via `beforeLoad`
   - `routes/capacitaciones/$id/asistencia.tsx`: 3 stat cards (Total/Asistieron/Pendientes) en tiempo real, lista con AsistenciaList, per-row save + save all + feedback alert, caps canceladas son read-only
4. **Botón "Tomar asistencia"** en detail page (`$id.index.tsx`) visible solo para `jefe_area` o `admin`
5. **Extensions backend integration**:
   - `services/capacitaciones.service.ts`: `listByArea(areaId)` → `GET /api/areas/:areaId/capacitaciones`
   - `hooks/useCapacitaciones.ts`: `useCapacitacionesByArea(areaId)` con `enabled: areaId > 0`

### Verificacion (navegador)

17/17 smoke tests pasaron:

- Login juan.perez (jefe_area) → sidebar 4 items
- GET `/dashboard/area` → header "Desarrollo", stat cards 26/6/3/6, PersonalTable con 26 personas, 3 caps en "Proximas" con Ver detalle + Tomar asistencia, 1 cap en "Cerradas" cancelada SIN Tomar asistencia
- Buscar "Lopez" en PersonalTable → filtra a 1 fila
- GET `/capacitaciones/1/asistencia` → 3 stat cards (1/0/1), lista con Browser Test
- Click "Asistio" → "Sin guardar" aparece, "Guardar todo 1" se habilita, stats cambian
- Click per-row save → alert exito, "Sin guardar" desaparece, "Guardar todo" disabled
- Verificado via `curl` → `asistio: True` en backend
- Expandir "Nota", escribir comentario, "Guardar todo" → alert "Se guardaron 1 actualizacion"
- Verificado via `curl` → comentario persistido en backend
- GET `/capacitaciones/1` → "Inscriptos" muestra "Asistio" para Browser Test
- GET `/capacitaciones/4/asistencia` (cancelada) → alert "Capacitacion cancelada", sin stats/lista/buttons
- Logout + login browser.test (usuario) → sidebar solo 2 items
- GET `/dashboard/area` como usuario → redirect `/dashboard`
- GET `/capacitaciones/1/asistencia` como usuario → redirect `/dashboard`
- GET `/capacitaciones/1` como usuario → sin "Tomar asistencia" button

### Decisiones

- **Patron useState + zod** (no react-hook-form): consistente con F06/F08
- **Componentes controlados**: AsistenciaList recibe drafts y callbacks (no maneja estado interno)
- **AsistenciaList con `isReadOnly`**: future-proofing para vista historica de caps cerradas
- **Layouts con `<Outlet />`**: convertidos dashboard.tsx y $id.tsx para soportar hijos
- **Canceladas read-only**: UX mas simple y previene errores
- **Feedback alert unificado**: mismo componente para exito/error de save all/per-row

### Lecciones

- **TanStack Router file-based requiere `<Outlet />`** para que rutas hijas rendericen
- **El orden de archivos importa**: standalone → layout+index para refactorizar
- **chrome-devtools `click` no dispara `onSubmit`** en forms React; workaround con `evaluate_script`
- **LSP cache** puede mostrar errores por archivos ya borrados; forzar con `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit`

### Proximo Paso

Iniciar **F09 - Backend - Integraciones Externas (Google Calendar + Microsoft Graph + Email)**, o alternativamente **F11 - Backend - Dashboard y Reportes**. Recomendacion: F09 primero (valor visible inmediato: notificaciones automaticas).
