# 🏗️ Arquitectura del Proyecto

## Visión General

**Plataforma de Agendas para Capacitaciones** es una aplicación full-stack para gestionar capacitaciones por área, con sincronización automática de calendarios y control de acceso basado en roles (RBAC).

---

## Stack Tecnológico

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL
- **ORM:** Drizzle ORM
- **Autenticación:** JWT + OAuth 2.0 (Google, Microsoft)
- **Validación:** ZOD
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** React 19
- **Lenguaje:** TypeScript
- **Routing:** TanStack Router
- **Data Fetching:** TanStack Query
- **State Management:** Zustand
- **Forms:** TanStack Form
- **Tables:** TanStack Table
- **Styling:** Tailwind CSS + Shadcn/ui
- **HTTP Client:** Axios
- **Testing:** Vitest + Testing Library

### Integraciones Externas
- **Google Calendar API:** Sincronización de eventos
- **Microsoft Graph API:** Sincronización con Outlook
- **Email:** SendGrid o Resend

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React + TypeScript + TanStack Router + TanStack Query     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Login   │  │Dashboard │  │Capacit.  │  │  Admin   │  │
│  │          │  │          │  │  CRUD    │  │  Panel   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  TanStack Query (Cache + Sync)                      │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Axios HTTP Client (Interceptors + Auth)            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           │ (JWT Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│          Node.js + Express + Drizzle ORM                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Routes Layer                                      │   │
│  │  /api/auth, /api/areas, /api/capacitaciones       │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                  │   │
│  │  • authenticate (JWT)                              │   │
│  │  • checkPermission (RBAC)                          │   │
│  │  • validation (ZOD)                                │   │
│  │  • errorHandler                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Controllers Layer                                 │   │
│  │  Business logic + orchestration                    │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Services Layer                                    │   │
│  │  • calendar-sync.service (Google + Outlook)        │   │
│  │  • email.service (SendGrid/Resend)                 │   │
│  │  • auth.service                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM                                       │   │
│  │  Type-safe queries                                 │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  │   (9 tablas)    │
                  └─────────────────┘
```

---

## Estructura de Base de Datos

### Tablas Principales

1. **areas** - 4 áreas de la empresa
   - Desarrollo, Operaciones, QA, Product Manager
2. **usuarios** - ~100 usuarios
   - Relación M:1 con áreas
3. **capacitaciones** - Eventos de capacitación
   - Relación M:1 con áreas (crucial para filtrado)
4. **registros_capacitacion** - M2M usuarios-capacitaciones
   - Registro de asistencia

### Tablas RBAC

5. **roles** - 4 roles base
   - usuario, capacitador, jefe_area, admin
6. **permisos** - Permisos granulares
   - capacitacion:crear, usuario:ver, etc.
7. **role_permisos** - M2M roles-permisos
8. **usuarios_roles** - M2M usuarios-roles
9. **auditoria_roles** - Log de cambios de roles

### Diagrama Relacional Simplificado

```
┌─────────────┐         ┌──────────────┐         ┌──────────────────┐
│   areas     │◀────────│   usuarios   │────────▶│  usuarios_roles  │
│             │   1:M   │              │   M:M   │                  │
│ • id        │         │ • id         │         │ • usuario_id     │
│ • nombre    │         │ • email      │         │ • rol_id         │
│ • jefe_id   │         │ • area_id    │         └──────────────────┘
└─────────────┘         └──────────────┘                  │
      │                        │                           │
      │                        │                           ▼
      │                        │                  ┌──────────────┐
      │                        │                  │    roles     │
      │                        │                  │              │
      │                        │                  │ • id         │
      │                        │                  │ • nombre     │
      │                        │                  └──────────────┘
      │                        │
      ▼                        ▼
┌──────────────────┐   ┌──────────────────────────┐
│  capacitaciones  │   │ registros_capacitacion   │
│                  │   │                          │
│ • id             │   │ • capacitacion_id        │
│ • area_id        │◀──│ • usuario_id             │
│ • capacitador_id │   │ • asistio                │
│ • fecha          │   └──────────────────────────┘
│ • google_event_id│
│ • outlook_event_id
└──────────────────┘
```

---

## Flujos Críticos

### 1. Crear Capacitación (Feature F08 - CRÍTICA)

```
┌────────────┐
│   Jefe     │
└──────┬─────┘
       │
       │ 1. Abre /capacitaciones/crear
       ▼
┌──────────────────────────────────────────┐
│  Formulario Crear Capacitación           │
│                                          │
│  SelectArea (dropdown)                   │
│  ┌────────────────────────────────────┐ │
│  │ Seleccionar área ▼                 │ │
│  └────────────────────────────────────┘ │
│                │                         │
│                │ 2. onChange              │
│                ▼                         │
│  GET /api/areas/:id/personal            │
│                │                         │
│                │ 3. Respuesta: [usuarios]│
│                ▼                         │
│  SelectCapacitador (combo dependiente)  │
│  ┌────────────────────────────────────┐ │
│  │ Juan Pérez (jefe)       ▼          │ │
│  │ María García (capacitador)         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Resto del formulario]                 │
│                                          │
│  [Botón Crear]                          │
└──────────┬───────────────────────────────┘
           │ 4. Submit
           ▼
    POST /api/capacitaciones
           │
           │ 5. Backend valida
           ▼
    INSERT INTO capacitaciones
           │
           │ 6. Sincroniza calendarios
           ├─────▶ Google Calendar API
           └─────▶ Microsoft Graph API
           │
           │ 7. Guarda event_ids
           ▼
    UPDATE capacitaciones SET google_event_id, outlook_event_id
           │
           │ 8. Respuesta
           ▼
    ┌──────────────────────────┐
    │ 201 Created              │
    │ { id, google_event_id... }│
    └──────────────────────────┘
```

**⚠️ PUNTO CRÍTICO:**
El combo de capacitadores DEBE actualizarse dinámicamente cuando cambia el área. Esto se logra con:
1. Estado React: `const [areaId, setAreaId] = useState(null)`
2. Hook: `const { data: personal } = useAreaPersonal(areaId)`
3. Filtrado: `const capacitadores = personal?.filter(...)`
4. Prop disabled: `disabled={!areaId}`

### 2. Registrarse a Capacitación

```
Usuario ve lista → Selecciona capacitación → Click "Registrarme"
     │                       │                        │
     ▼                       ▼                        ▼
GET /capacitaciones   GET /capacitaciones/:id   POST /capacitaciones/:id/registrar
     │                       │                        │
     │                       │                        ├─ INSERT registros_capacitacion
     │                       │                        ├─ Si OAuth: Agregar a calendario personal
     │                       │                        └─ Enviar email confirmación
     │                       │
     └───────────────────────┴─────────────────────▶ UI actualizada
```

### 3. RBAC (Control de Acceso)

```
Request → authenticate → checkPermission → Controller
   │            │               │              │
   │            │               │              ▼
   │            │               │         Business Logic
   │            │               │              │
   │            │               ▼              ▼
   │            │         Consulta permisos   Response
   │            │         del usuario
   │            │         en BD
   │            ▼
   │      Verifica JWT
   │      Extrae user_id
   │      Agrega a req.user
   ▼
Token válido?
```

**Ejemplo:**
```javascript
// Usuario regular intenta crear capacitación
POST /api/capacitaciones
Authorization: Bearer <user_token>

// Flujo:
1. authenticate: ✅ Token válido, req.user = {id: 5, roles: ['usuario']}
2. checkPermission('capacitacion:crear'): ❌ Usuario no tiene permiso
3. Response: 403 Forbidden
```

---

## Arquitectura de Directorios

### Backend

```
backend/
├── src/
│   ├── routes/                 # Definición de endpoints
│   │   ├── auth.js            # POST /api/auth/*
│   │   ├── areas.js           # GET /api/areas/*
│   │   ├── usuarios.js        # GET /api/usuarios/*
│   │   ├── capacitaciones.js # CRUD capacitaciones
│   │   ├── registros.js       # Registros M2M
│   │   └── dashboard.js       # Dashboards
│   │
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── areasController.js
│   │   ├── usuariosController.js
│   │   ├── capacitacionesController.js
│   │   └── registrosController.js
│   │
│   ├── middleware/            # Middleware
│   │   ├── auth.js           # JWT verification
│   │   ├── rbac.js           # Permission checking
│   │   ├── validation.js     # ZOD validation
│   │   └── errorHandler.js   # Global error handler
│   │
│   ├── services/              # External services
│   │   ├── calendar-sync.service.js
│   │   ├── google-calendar.service.js
│   │   ├── microsoft-graph.service.js
│   │   ├── email.service.js
│   │   └── auth.service.js
│   │
│   ├── db/                    # Database
│   │   ├── schema.ts         # Drizzle schema (9 tables)
│   │   ├── migrations/       # DB migrations
│   │   ├── seed.ts           # Seed data
│   │   └── index.ts          # DB connection
│   │
│   ├── utils/                 # Utilities
│   │   ├── logger.js
│   │   └── validators.js
│   │
│   └── app.js                 # Express app setup
│
├── tests/                     # Tests
│   ├── auth.test.js
│   ├── areas.test.js
│   └── capacitaciones.test.js
│
├── .env                       # Environment variables
├── .env.example               # Example env file
├── package.json
└── drizzle.config.ts          # Drizzle configuration
```

### Frontend

```
frontend/agenda-frontend/
├── src/
│   ├── routes/                        # TanStack Router pages
│   │   ├── __root.tsx                # Root layout
│   │   ├── index.tsx                 # Home
│   │   ├── login.tsx                 # Login page
│   │   ├── register.tsx              # Register page
│   │   ├── dashboard.tsx             # User dashboard
│   │   │
│   │   ├── auth/
│   │   │   ├── google-callback.tsx
│   │   │   └── outlook-callback.tsx
│   │   │
│   │   ├── capacitaciones/
│   │   │   ├── index.tsx            # Lista
│   │   │   ├── $id.tsx              # Detalles
│   │   │   ├── crear.tsx            # Crear (CRÍTICO)
│   │   │   └── $id.asistencia.tsx   # Marcar asistencia
│   │   │
│   │   ├── dashboard/
│   │   │   └── area.tsx             # Dashboard jefe
│   │   │
│   │   └── admin/
│   │       ├── usuarios.tsx
│   │       ├── roles.tsx
│   │       └── areas.tsx
│   │
│   ├── components/                   # Reusable components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── SelectArea.tsx           # Dropdown áreas
│   │   ├── SelectCapacitador.tsx    # Combo dependiente ⭐
│   │   ├── CapacitacionForm.tsx     # Formulario crear/editar
│   │   ├── CapacitacionCard.tsx     # Card capacitación
│   │   └── PersonalTable.tsx        # Tabla personal
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts               # Auth hook
│   │   ├── useCapacitaciones.ts     # Capacitaciones hook
│   │   └── useAreas.ts              # Áreas hook (+ useAreaPersonal)
│   │
│   ├── lib/                          # Libraries
│   │   ├── api.ts                   # Axios instance
│   │   └── queryClient.ts           # TanStack Query client
│   │
│   ├── store/                        # Zustand stores
│   │   └── authStore.ts             # Auth state
│   │
│   ├── types/                        # TypeScript types
│   │   ├── usuario.ts
│   │   ├── capacitacion.ts
│   │   └── area.ts
│   │
│   ├── router.tsx                    # Router setup
│   └── styles.css                    # Global styles
│
├── package.json
└── vite.config.ts
```

---

## Patrones de Diseño

### Backend

1. **MVC Pattern:**
   - Routes: Define endpoints
   - Controllers: Business logic
   - Models: Drizzle schemas

2. **Middleware Chain:**
   ```javascript
   router.get('/:id',
     authenticate,               // 1. Verificar JWT
     checkPermission('area:ver'), // 2. Verificar permisos
     getAreaById                 // 3. Controller
   );
   ```

3. **Service Layer:**
   - Controllers orquestan
   - Services hacen el trabajo pesado (APIs externas, email)

### Frontend

1. **Component Composition:**
   ```typescript
   <CapacitacionForm>
     <SelectArea onChange={handleAreaChange} />
     <SelectCapacitador capacitadores={filteredUsers} />
     <DatePicker />
     <TimePicker />
   </CapacitacionForm>
   ```

2. **Custom Hooks:**
   - Encapsulan lógica de data fetching
   - Reutilizables en múltiples componentes

3. **Controlled Components:**
   - Todo el estado en el componente padre
   - Props down, events up

---

## Decisiones Arquitectónicas

### 1. ¿Por qué Drizzle ORM?
- Type-safe queries
- Mejor rendimiento que Prisma
- Migraciones automáticas
- SQL-like syntax (fácil de aprender)

### 2. ¿Por qué TanStack Query?
- Cache automático
- Sincronización en background
- Optimistic updates
- DevTools excelentes

### 3. ¿Por qué Zustand sobre Redux?
- Más simple
- Menos boilerplate
- Suficiente para este proyecto

### 4. ¿Por qué JWT y no sesiones?
- Stateless
- Escalable
- Compatible con mobile apps futuras

### 5. ¿Por qué RBAC y no simples roles?
- Granularidad
- Escalabilidad
- Auditoría

---

## Escalabilidad

### Actualmente (100 usuarios)
- Monolito suficiente
- PostgreSQL maneja carga
- Un solo servidor

### Futuro (1000+ usuarios)
- Separar servicios de calendarios (microservicio)
- Redis para cache
- Load balancer
- Replicación de BD

---

## Seguridad

1. **Autenticación:** JWT con expiración
2. **Autorización:** RBAC granular
3. **Validación:** ZOD en backend + frontend
4. **SQL Injection:** Protegido por Drizzle ORM
5. **XSS:** React escapa por defecto
6. **CSRF:** No necesario (JWT stateless)
7. **Rate Limiting:** TODO (implementar en F13)

---

## Monitoreo (Futuro)

- Logs centralizados (Winston)
- Uptime monitoring
- Error tracking (Sentry)
- Analytics (opcional)

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo
