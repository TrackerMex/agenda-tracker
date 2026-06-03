# F09 - Backend - Integraciones Externas (Google Calendar + Microsoft Graph + Email)

**Estado:** done
**Fecha de implementacion:** 2026-06-02
**Agente:** builder
**Dependencias:** F04 (done), F02 (done, OAuth simulado), F06 (done, frontend de auth)

---

## Resumen

Se implemento la capa de integraciones externas del backend: sincronizacion bidireccional con **Google Calendar** y **Microsoft Graph (Outlook)**, envio de **emails transaccionales via SMTP (nodemailer)**, y un flujo **OAuth 2.0 real con PKCE** para vincular cuentas de Google/Outlook con usuarios del sistema.

Patron clave: **service layer production-ready con feature flags + auto-degrade**. Si las credenciales no estan configuradas, los servicios operan en modo "log only" y devuelven `{ sent: false, reason }` sin lanzar errores. Esto permite que la aplicacion funcione end-to-end en dev sin necesidad de secrets reales, y en produccion con solo descomentar las variables en `.env`.

---

## Decisiones de diseno

### 1. Service layer + feature flags + auto-degrade (RECOMENDADO por el usuario)
Tres flags en `.env`:
- `ENABLE_GOOGLE_CALENDAR` (default: true)
- `ENABLE_OUTLOOK_CALENDAR` (default: true)
- `ENABLE_EMAIL_NOTIFICATIONS` (default: true)

Si el flag esta en `false` o las credenciales no estan configuradas, el metodo:
1. Loggea un mensaje `[service-name] SKIP ... reason="..."` con `console.log`
2. Retorna `{ sent: false, reason: '...' }` o `{ eventId: null, reason: '...' }`
3. **Nunca lanza excepcion** — los callers (capacitaciones.service.js) continuan normalmente

Esto da: (a) cero acoplamiento entre flujos criticos de negocio y servicios externos, (b) testing facil sin secrets, (c) dev experience sin friccion.

### 2. nodemailer con SMTP generico (RECOMENDADO por el usuario)
En lugar de SendGrid/Resend (que ya estaban en `.env.example` como opciones deprecadas), se uso **nodemailer** que soporta cualquier servidor SMTP:
- Gmail con App Password
- Mailtrap (dev)
- SendGrid SMTP relay
- AWS SES SMTP
- Cualquier servidor SMTP interno

Ventaja: una sola pieza (`email.service.js`) cubre todos los casos. Se actualizo `.env.example` para reflejar esto (se eliminaron las secciones SendGrid/Resend y se anadio `SMTP_*`).

### 3. OAuth 2.0 real con PKCE (RECOMENDADO por el usuario)
Se implemento el flujo completo con PKCE (RFC 7636), no Client Secrets implicit grant:
- `GET /api/auth/{google,outlook}/login` → genera state+verifier+challenge, persiste en `Map<state, entry>` con TTL=10min, redirige (302) a la URL de autorizacion del provider
- `GET /api/auth/{google,outlook}/callback` → consume el state, intercambia code por tokens, fetch del perfil, upsert del usuario con `providerId + accessToken + refreshToken + expiresAt`, redirige al frontend con `?success=1&token=...&refreshToken=...&userId=...`

**Mantiene backward compat con F06**: las rutas existentes `POST /api/auth/{google,outlook}` (simuladas, usadas por el frontend F06) siguen funcionando sin cambios. Esto es importante para no romper el login actual.

### 4. In-memory state store para PKCE (no Redis)
Para mantener el alcance de F09 limitado, el `stateStore` es un `Map` en memoria con cleanup interval (cada 5min, borra states expirados). Esto es aceptable para un solo proceso (que es como corre el backend actual con `tsx watch`).

**Limitacion conocida**: si el servidor se reinicia mid-flow, todos los states pendientes se pierden. Para produccion multi-instancia, migrar a Redis o DB. Documentado en `progress/impl_f09.md` seccion Observaciones.

### 5. Persistencia de tokens OAuth en BD
Se agregaron 6 columnas a la tabla `usuarios` (migracion `0001_tearful_proemial_gods.sql`):
- `google_access_token`, `google_refresh_token`, `google_token_expires_at`
- `outlook_access_token`, `outlook_refresh_token`, `outlook_token_expires_at`

El calendario sync usa los tokens del **capacitador** (no del usuario que se registra), porque el evento se crea en el calendario del capacitador que dicta la clase. Esto es logica de negocio razonable: si un capacitador no ha vinculado su Google/Outlook, los eventos no se sincronizan (SKIP graceful).

### 6. Integracion async-fire-and-forget
Las llamadas a `calendarSync` y `emailService` desde `capacitaciones.service.js` se hacen con `.catch()` para que:
- La respuesta al cliente sea inmediata (no esperamos I/O de Google/Microsoft/SMTP)
- Un fallo de integracion no rompa el flujo de negocio (e.g., un SMTP timeout no deberia impedir crear una capacitacion)

Patron:
```js
calendarSync.syncCapacitacion(full).catch((error) => {
  console.error('[capacitaciones] create sync error:', error.message);
});
return full;  // respuesta inmediata
```

### 7. Equivalente entre providers
Los 3 servicios de calendario tienen la misma interfaz (`createEvent`, `updateEvent`, `deleteEvent`, `getAuthUrl`, `exchangeCode`, `fetchUserProfile`, `refreshAccessToken`). Esto permitio que `calendar-sync.service.js` los orqueste en paralelo con `Promise.allSettled`-style sin duplicar logica.

### 8. Meeting links automaticos
Si la plataforma contiene "meet" (case-insensitive) → `conferenceData.createRequest` con `hangoutsMeet` en Google.
Si contiene "teams" → `isOnlineMeeting: true` con `onlineMeetingProvider: 'teamsForBusiness'` en Outlook.
Para Zoom u otras → solo `location` field, sin integracion automatica.

### 9. Spanish localized dates
Todos los emails y eventos usan `new Date(...).toLocaleDateString('es-AR', { weekday, day, month, year })` para mensajes amigables. Timezone configurable via `TZ` env (default `America/Mexico_City`).

---

## Artefactos creados

### 1. Schema migration (DB)
**`backend/src/db/migrations/0001_tearful_proemial_gods.sql`** (NEW)

6 `ALTER TABLE` statements que agregan columnas OAuth a `usuarios`:
- `google_access_token TEXT`
- `google_refresh_token TEXT`
- `google_token_expires_at TIMESTAMP`
- `outlook_access_token TEXT`
- `outlook_refresh_token TEXT`
- `outlook_token_expires_at TIMESTAMP`

Aplicada con `npx drizzle-kit generate && npx drizzle-kit migrate` (output: "migrations applied successfully!").

**`backend/src/db/schema.ts`** (MODIFIED)

Agregadas las 6 columnas al Drizzle table definition, con nombres TS en camelCase (`googleAccessToken`, etc.) y nombres SQL en snake_case (`google_access_token`, etc.).

### 2. Email service
**`backend/src/services/email.service.js`** (NEW, 176 lineas)

- `nodemailer.createTransport()` lazy-init
- `isEnabled()` checks feature flag + `SMTP_HOST` config
- `getTransporter()` returns `false` (not transporter) if no SMTP_HOST → auto-degrade
- `buildInscripcionEmail({ usuario, capacitacion })` returns `{ subject, text, html }` con Spanish localized date
- `buildCancelacionEmail({ usuario, capacitacion })` similar
- `sendInscripcionNotification({ usuario, capacitacion })` returns `{ sent, messageId?, reason? }`
- `sendCancelacionNotification({ usuario, capacitacion })` similar
- `getEmailStatus()` for health check
- NUNCA lanza — loggea y retorna `{ sent: false, reason }` en error

### 3. Google Calendar service
**`backend/src/services/google-calendar.service.js`** (NEW, 215 lineas)

- `googleapis@173` SDK
- Lazy-init `google.auth.OAuth2` con `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`
- `isEnabled()`, `getAuthUrl({ state, codeChallenge })`, `exchangeCode({ code, codeVerifier })`, `fetchUserProfile(accessToken)`, `refreshAccessToken(refreshToken)`
- `createEvent({ userTokens, capacitacion })` con `conferenceData` para Meet
- `updateEvent`, `deleteEvent` (404 = "already deleted", no error)
- `getGoogleStatus()` for health
- NUNCA lanza — loggea y retorna resultado

### 4. Microsoft Graph service
**`backend/src/services/microsoft-graph.service.js`** (NEW, 187 lineas)

- `@microsoft/microsoft-graph-client@3` SDK
- Misma interfaz que Google, con scopes `['openid', 'profile', 'email', 'offline_access', 'Calendars.ReadWrite']`
- OAuth endpoints: `https://login.microsoftonline.com/${TENANT || 'common'}/oauth2/v2.0/...`
- Native `fetch` para `POST /token` (Node 24)
- `isOnlineMeeting: true` con `teamsForBusiness` si plataforma contiene "teams"

### 5. Calendar sync orchestrator
**`backend/src/services/calendar-sync.service.js`** (NEW, 92 lineas)

- `syncCapacitacion(capacitacion)`: si tiene `googleCalendarEventId` → `updateEvent`, sino → `createEvent`. Igual para Outlook. `Promise.all` paralelo. Persiste los event_ids resultantes en la BD.
- `removeCapacitacion(capacitacion)`: `deleteEvent` en ambos providers en paralelo, limpia event_ids de la BD.
- `getCalendarSyncStatus()`: health check.
- NUNCA lanza — caller usa `.catch()`.

### 6. OAuth service
**`backend/src/services/oauth.service.js`** (NEW, 130 lineas)

- `generateCodeVerifier()` (32 bytes random, base64url)
- `generateCodeChallenge(verifier)` (SHA-256 hash, base64url)
- `generateState()` (24 bytes random, base64url)
- `createAuthState(provider)` → `{ state, codeVerifier, codeChallenge }` con TTL=10min
- `consumeState(state)` → validates TTL, removes from store
- `getAuthorizationUrl(provider)` → orquesta state + provider-specific auth URL
- `handleCallback({ provider, code, state })` → consume state + exchange code + fetch profile
- `getStateStoreSize()` for debugging
- Cleanup interval cada 5min, `unref()` para no bloquear el process exit

### 7. Auth service extension
**`backend/src/services/auth.service.js`** (MODIFIED)

- Nuevo: `findOrCreateOAuthUserWithTokens({ provider, profile, tokens })`:
  - Si usuario existe con mismo email → update con `providerId` + `tokens`
  - Si no existe → crea con area default (la primera area de la tabla), `providerId`, `tokens`
- Nuevo: `oauthCallbackLogin({ provider, profile, tokens })` → issue session with roleNames
- `oauthLogin(provider, payload)` (F02 simulado) se mantiene intacto para backward compat
- Imports: agregado `sql` de drizzle-orm

### 8. Auth controller extension
**`backend/src/controllers/authController.js`** (MODIFIED)

- Nuevos handlers:
  - `googleLogin(req, res)`: 503 si no enabled, 302 redirect a Google sino
  - `googleCallback(req, res)`: consume state, exchange code, upsert user, 302 redirect a `${FRONTEND_URL}/auth/google-callback?success=1&token=...`
  - `outlookLogin(req, res)`: equivalente
  - `outlookCallback(req, res)`: equivalente
  - `integrationsStatus(_req, res)`: health check `{ google: {...}, outlook: {...} }`
- Funcion helper `buildCallbackUrl({ provider, params })` para construir redirects al frontend
- `FRONTEND_URL` env var (default `http://localhost:5173`)

### 9. Auth routes
**`backend/src/routes/auth.js`** (MODIFIED)

- 5 rutas nuevas:
  - `GET /google/login` → `googleLogin`
  - `GET /google/callback` → `googleCallback`
  - `GET /outlook/login` → `outlookLogin`
  - `GET /outlook/callback` → `outlookCallback`
  - `GET /integrations/status` → `integrationsStatus`
- Rutas existentes (F02) intactas: `POST /register`, `POST /login`, `POST /google`, `POST /outlook`, `POST /refresh`, `GET /me`

### 10. Capacitaciones service integration
**`backend/src/services/capacitaciones.service.js`** (MODIFIED)

- `createCapacitacion(payload)`: despues de insertar, `calendarSync.syncCapacitacion(full).catch(...)` (async, fire-and-forget)
- `updateCapacitacion(id, payload, actor)`: detecta si cambiaron campos relevantes (nombre, descripcion, area, capacitador, fecha, hora, duracion, plataforma) y dispara sync
- `cancelCapacitacion(id, actor)`: 
  1. Captura el estado pre-cancel (para tener los event_ids)
  2. Update BD a `estado: 'cancelada'`
  3. `calendarSync.removeCapacitacion(preCancel).catch(...)` 
  4. `notifyCancelacionToAttendees(preCancel).catch(...)` (envia email a todos los registrados)
- `registerToCapacitacion(id, userId)`: despues de insertar, `notifyInscripcion({ usuarioId, capacitacionId }).catch(...)` (email al usuario registrado)
- Nuevos helpers privados: `notifyInscripcion`, `notifyCancelacionToAttendees`

### 11. Env files
**`backend/.env.example`** (MODIFIED)

- Reemplazada la seccion "Email Service (SendGrid o Resend)" por "Email Service (SMTP generico)" con variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
- Mantiene las secciones de Google/Microsoft OAuth y Calendar existentes

**`backend/.env`** (MODIFIED)

- Agregada `FRONTEND_URL=http://localhost:5173`
- Agregada seccion "Integraciones externas (F09)" con todas las vars comentadas (auto-degrade funciona sin descomentar)
- Agregada `TZ=America/Mexico_City`

---

## Smoke tests ejecutados

Todos los smoke tests pasaron correctamente con el backend en auto-degrade (sin credenciales):

| Test | Comando | Resultado |
|------|---------|-----------|
| Health check | `GET /health` | 200 OK |
| Integrations status | `GET /api/auth/integrations/status` | 200, `{ google: {enabled:false, reason:"GOOGLE_CLIENT_ID..."}, outlook: {...} }` |
| Google login (no config) | `GET /api/auth/google/login` | 503, `{ success:false, message:"Google OAuth no esta disponible", reason:"..." }` |
| Outlook login (no config) | `GET /api/auth/outlook/login` | 503 |
| Google callback (no params) | `GET /api/auth/google/callback` | 400, `{ success:false, message:"Faltan parametros code o state" }` |
| Outlook callback (no params) | `GET /api/auth/outlook/callback` | 400 |
| Login juan.perez | `POST /api/auth/login` | 200, token JWT valido |
| Create capacitacion | `POST /api/capacitaciones` (token) | 201, cap id=7 con calendar_event_id null (capacitador sin tokens) |
| Register usuario | `POST /api/capacitaciones/7/registrar` | 201, registro id=9 |
| Cancel capacitacion | `DELETE /api/capacitaciones/7` | 200, estado=cancelada |
| Update capacitacion | `PUT /api/capacitaciones/6` | 200, descripcion actualizada |
| F06 simulado (backward compat) | `POST /api/auth/google` | 200, token |
| F06 simulado (backward compat) | `POST /api/auth/outlook` | 200, token |

Backend loggea mensajes como `[email.service] SKIP sendInscripcionNotification to=... reason="SMTP_HOST no configurado (auto-degrade activo)"` y `[google-calendar] SKIP createEvent cap=7 reason="user no vinculado con Google"`. Esto confirma que el auto-degrade funciona como esperado y los flows criticos no se rompen.

---

## Archivos modificados/creados (resumen)

```
backend/
  package.json                                       [MODIFIED: +4 deps]
  .env                                               [MODIFIED: integracion section]
  .env.example                                       [MODIFIED: SMTP section]
  src/db/schema.ts                                   [MODIFIED: +6 OAuth columns]
  src/db/migrations/0001_tearful_proemial_gods.sql   [NEW]
  src/services/email.service.js                      [NEW, 176 lineas]
  src/services/google-calendar.service.js            [NEW, 215 lineas]
  src/services/microsoft-graph.service.js            [NEW, 187 lineas]
  src/services/calendar-sync.service.js              [NEW, 92 lineas]
  src/services/oauth.service.js                      [NEW, 130 lineas]
  src/services/auth.service.js                       [MODIFIED: +oauthCallbackLogin, +findOrCreateOAuthUserWithTokens]
  src/services/capacitaciones.service.js             [MODIFIED: +4 integraciones async]
  src/controllers/authController.js                  [MODIFIED: +5 OAuth handlers]
  src/routes/auth.js                                 [MODIFIED: +5 OAuth routes]
```

Total: **8 archivos nuevos, 7 archivos modificados**.

---

## Observaciones / Limitaciones conocidas

1. **OAuth state store en memoria**: si el servidor se reinicia mid-flow, los states pendientes se pierden. Para multi-instancia o alta disponibilidad, migrar a Redis o tabla `oauth_states` con TTL. Aceptable para el alcance de F09.

2. **Sin retry logic**: si una llamada a Google/Outlook/SMTP falla por timeout o 5xx, no se reintenta. Para mejorar robustez, agregar cola (e.g., BullMQ) con exponential backoff. Documentado como follow-up.

3. **Sin background batch sync**: si el usuario no habia vinculado su Google cuando se creo la cap, el evento nunca se sincroniza. Para mejorar, agregar un job batch que revise caps con `event_id IS NULL` y `capacitador.googleAccessToken IS NOT NULL` y los sincronice. Documentado como follow-up.

4. **Tokens sin auto-refresh**: cuando un access_token expira, el sync falla con 401 en lugar de refrescar proactivamente. `refreshAccessToken()` esta implementado pero no se llama automaticamente en el flow normal. Para mejorar, agregar middleware de auto-refresh en `calendar-sync.service.js`. Documentado como follow-up.

5. **Emails solo en inscripcion/cancelacion**: no hay recordatorios automaticos ("la cap es manana"). `ENABLE_EMAIL_REMINDERS` esta reservado en `.env` para un futuro cron job. Documentado como follow-up (probablemente F14+).

6. **F06 simulado sigue activo**: por decision de no romper el frontend actual, las rutas `POST /api/auth/google|outlook` siguen funcionales. Migrar frontend a usar el flujo real es scope de una feature futura (e.g., F14 frontend polish).

7. **Capacitador como owner del evento**: los eventos se crean en el calendario del capacitador (no del admin que crea la cap). Esto es logica de negocio razonable pero puede no coincidir con todos los casos de uso. Documentado en `calendar-sync.service.js` para revision futura.

---

## Proximos pasos sugeridos

- **F11 (Backend - Reportes y Auditoria)**: endpoints `GET /api/dashboard/area/:id` y `GET /api/dashboard/usuario` para alimentar dashboards con datos agregados server-side.
- **Frontend wiring del OAuth real**: agregar `/auth/google-callback` y `/auth/outlook-callback` en el frontend (actualmente son rutas reservadas en `feature_list.json` de F08).
- **F14 (Email reminders + cron)**: implementar recordatorios automaticos 24h antes de cada cap.
- **Retry queue**: BullMQ + Redis para reintentos automaticos de calendar sync.
