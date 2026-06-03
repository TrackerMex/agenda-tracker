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

---

## [2026-06-02] F09 - Backend - Integraciones Externas

**Feature:** F09 - Backend - Integraciones Externas (Google Calendar + Microsoft Graph + Email)
**Status:** done
**Builder:** Claude Sonnet
**Reviewer:** Claude Sonnet

### Acciones Realizadas

1. **Schema Migration (F09-1)**:
   - 6 columnas OAuth agregadas a `usuarios`: `google_access_token`, `google_refresh_token`, `google_token_expires_at`, `outlook_access_token`, `outlook_refresh_token`, `outlook_token_expires_at`
   - Migracion `0001_tearful_proemial_gods.sql` generada y aplicada con exito

2. **Dependencias Backend (F09-2)**:
   - `googleapis@173.0.0` - SDK oficial de Google APIs (Calendar v3, OAuth2)
   - `@microsoft/microsoft-graph-client@3.0.7` - SDK de Microsoft Graph
   - `@azure/identity@4.13.1` - peer dep del graph client
   - `nodemailer@8.0.10` - SMTP generico (Gmail, Mailtrap, SES, etc.)

3. **Service Layer (F09-3)**:
   - `email.service.js` (176 lineas): nodemailer con auto-degrade, templates HTML+texto en espanol, `sendInscripcionNotification` + `sendCancelacionNotification`. NUNCA lanza.
   - `google-calendar.service.js` (215 lineas): googleapis SDK, PKCE, `createEvent`/`updateEvent`/`deleteEvent` con Meet link auto. NUNCA lanza.
   - `microsoft-graph.service.js` (187 lineas): graph client SDK, `createEvent`/`updateEvent`/`deleteEvent` con Teams link auto. NUNCA lanza.
   - `calendar-sync.service.js` (92 lineas): orchestrator paralelo Google+Outlook, persiste event_ids en BD.
   - `oauth.service.js` (130 lineas): PKCE state store in-memory con TTL=10min, cleanup cada 5min.

4. **Auth Service Extension (F09-4)**:
   - `findOrCreateOAuthUserWithTokens({ provider, profile, tokens })`: upsert user con `providerId` + `accessToken` + `refreshToken` + `expiresAt`
   - `oauthCallbackLogin({ provider, profile, tokens })`: issue session con roleNames
   - Mantiene `oauthLogin(provider, payload)` (F02 simulado) para backward compat

5. **Auth Controller + Routes (F09-5)**:
   - 5 handlers nuevos: `googleLogin`, `googleCallback`, `outlookLogin`, `outlookCallback`, `integrationsStatus`
   - 5 rutas nuevas en `routes/auth.js`: `GET /google/login`, `GET /google/callback`, `GET /outlook/login`, `GET /outlook/callback`, `GET /integrations/status`
   - Mantiene 6 rutas F02 (register, login, google, outlook, refresh, me)

6. **Capacitaciones Service Integration (F09-6)**:
   - `createCapacitacion`: `calendarSync.syncCapacitacion(full).catch(...)` async fire-and-forget
   - `updateCapacitacion`: detecta cambios en campos relevantes, dispara sync
   - `cancelCapacitacion`: `calendarSync.removeCapacitacion(preCancel)` + `notifyCancelacionToAttendees(preCancel)` async
   - `registerToCapacitacion`: `notifyInscripcion({ usuarioId, capacitacionId })` async
   - Helpers privados: `notifyInscripcion`, `notifyCancelacionToAttendees`

7. **Env Files (F09-7)**:
   - `.env.example`: seccion "Email Service" actualizada a SMTP generico (elimina SendGrid/Resend deprecados)
   - `.env`: agregada `FRONTEND_URL` + seccion "Integraciones externas (F09)" con vars comentadas

8. **Smoke Tests (F09-8)**:
   - 12/12 tests pasaron con auto-degrade activo (sin credenciales reales)
   - Health check, integrations status, OAuth routes (503/400 esperados), create/register/cancel/update cap, backward compat F06 simulado

### Decisiones

- **Service layer + feature flags + auto-degrade**: servicios NUNCA lanzan, retornan `{ sent: false, reason }`. Aplicacion funciona end-to-end sin credenciales.
- **nodemailer con SMTP generico** (vs SendGrid/Resend): cubre Gmail, Mailtrap, SES, etc. con una sola pieza
- **OAuth 2.0 real con PKCE** (vs implicit grant o simulado): production-ready, seguro para SPAs
- **In-memory state store** (vs Redis): aceptable para single-instance, documentado para migracion futura
- **Integracion async fire-and-forget**: respuestas HTTP inmediatas, fallos de I/O no rompen flujos de negocio
- **Backward compat con F06**: rutas POST simuladas siguen funcionando, no rompe frontend actual
- **Capacitador como owner del evento**: eventos se crean en calendario del capacitador que dicta la clase
- **Meeting links auto-detectados**: "meet" → Google Meet, "teams" → MS Teams, otros → solo location field
- **Spanish localized dates**: `toLocaleDateString('es-AR')` en emails y eventos

### Lecciones

- **Auto-degrade es clave** para integrar servicios externos sin acoplarse a credenciales: el codigo siempre funciona, los servicios externos son opt-in via env vars
- **Integracion async fire-and-forget** evita latencia en respuestas HTTP y desacopla I/O de negocio
- **PKCE state en memoria** es aceptable para single-instance pero hay que planificar migracion a Redis/DB para multi-instance
- **Backward compat con flujos simulados** (F06) es importante: agregar OAuth real no debe romper el frontend que ya funciona
- **LSP errors pre-existentes** en `schema.ts` (recursive Drizzle types) y archivos F10 refactorizados (cache stale) no son bloqueantes


---

## [2026-06-02] F11 - Backend - Dashboard y Reportes

**Feature:** F11 - Backend - Dashboard y Reportes
**Status:** done
**Builder:** Claude Sonnet
**Reviewer:** Claude Sonnet

### Acciones Realizadas

1. **Service** (`backend/src/services/dashboard.service.js`, NEW, ~230 lineas):
   - `getAreaDashboard(areaId, actor)`: retorna `{ area, stats, capacitaciones: { futuras, realizadas, cerradas } }`
   - `getUsuarioDashboard(actor)`: retorna `{ stats, mis_proximas_capacitaciones }`
   - 11 helpers internos: `countPersonal`, `countCapacitadores`, `countCapsByState`, `countInscritosTotal`, `listCapsForArea`, `listMisProximas`, `countInscripcionesByState`, `countProximasActivas`, `sumCuposLibres`, `ensureCanViewArea`, formatters
   - SQL aggregations: `COUNT`, `SUM`, subqueries, `GROUP BY`
   - `Promise.all` para paralelizar (7 queries en area, 4 en usuario)
   - Casts `::int` explicitos para evitar bigint->string de postgres.js

2. **Controller** (`backend/src/controllers/dashboardController.js`, NEW, 38 lineas):
   - `area(req, res)`: handler de `GET /area/:id`, valida param con Zod `idSchema`
   - `usuario(req, res)`: handler de `GET /usuario`
   - `handleError` estandar (mismo patron que controllers existentes)

3. **Routes** (`backend/src/routes/dashboard.js`, NEW, 11 lineas):
   - `router.use(auth)` requiere JWT
   - `GET /area/:id` → `area`
   - `GET /usuario` → `usuario`

4. **App** (`backend/src/app.js`, MODIFIED):
   - +2 lineas: `import dashboardRoutes` + `app.use('/api/dashboard', dashboardRoutes)`

5. **Smoke tests** (12/12 pasaron):
   - Auth (sin token) → 401 ✓
   - Juan (jefe Desarrollo) → `/area/1` (own area) → 200 con stats 29/6/3/7 ✓
   - Juan → `/area/2` (NOT own area) → 403 ✓
   - Juan → `/area/999` (no existe) → 404 ✓
   - Luis (jefe Operaciones) → `/area/2` (own area) → 200 ✓
   - Luis → `/area/1` (NOT own area) → 403 ✓
   - Carlos (usuario regular) → `/area/1` → 403 ✓
   - Cualquier user → `/usuario` → 200 ✓
   - `/area/abc` (id invalido) → 400 ✓
   - Data flow: Carlos registra a cap → `inscripciones_totales: 1→2, proximas_activas: 0→1, mis_proximas: 1 entry` ✓

### Decisiones

- **Matchear shape actual del frontend** (recomendado por usuario): permite migracion futura sin UI changes
- **Validacion en service, no en middleware**: la regla "jefe_area solo de su area" no se puede expresar como `requirePermission`
- **Sin nuevos permisos en BD**: usar permisos existentes + validacion custom evita inflar tabla `permisos`
- **SQL aggregations sobre client-side**: `COUNT`, `SUM`, subqueries son O(1) vs O(N)
- **`Promise.all` para paralelizar**: 7 queries en `getAreaDashboard` corren en paralelo
- **No migrar frontend** (recomendado por usuario): endpoints existen como API paralela, scope minimizado
- **Scope acotado a 2 endpoints** (recomendado por usuario): sin reportes de asistencia ni auditoria, esos van a features separadas
- **Bigint->string handling**: cast a `::int` detectado y arreglado en smoke tests (patron conocido en postgres.js)

### Lecciones

- **postgres.js retorna bigint como string por default** — siempre castear a `::int` o `::text` segun el caso de uso
- **Smoke tests manuales con curl** son valiosos pero no escalables — F12 los reemplazara con automatizados
- **Custom RBAC en service** es valido cuando la regla no se puede expresar como `requirePermission` simple
- **Matchear shape del frontend** permite migracion sin UI changes — buen principio para evitar refactors en cascada
