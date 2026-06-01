# 📅 Plataforma de Agendas para Capacitaciones

Sistema centralizado para gestionar capacitaciones por área, con sincronización automática de calendarios, notificaciones por email y control de acceso basado en roles (RBAC).

## 🎯 Características Principales

- ✅ Gestión de capacitaciones por área (Desarrollo, Operaciones, QA, Product Manager)
- ✅ Sincronización automática con Google Calendar y Outlook
- ✅ Sistema de registro y control de asistencia
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Notificaciones por email
- ✅ Dashboard para jefes de área
- ✅ Reportes de asistencia y auditoría

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend:**
- Node.js + Express.js
- PostgreSQL + Drizzle ORM
- JWT + OAuth 2.0 (Google, Microsoft)
- ZOD para validaciones

**Frontend:**
- React 19 + TypeScript
- TanStack Router + TanStack Query
- Zustand (state management)
- Tailwind CSS + Shadcn/ui

**Integraciones:**
- Google Calendar API
- Microsoft Graph API (Outlook)
- SendGrid/Resend (Email)

### Arquitectura Harness Subagentes

Este proyecto utiliza **Harness Engineering** con arquitectura multi-agente:

```
Orchestrator (Líder) → Planifica y coordina
     ↓
Builder (Implementador) → Escribe código
     ↓
Reviewer (Validador) → Asegura calidad
```

## 📂 Estructura del Proyecto

```
agenda-tracker/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── routes/            # Endpoints REST
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middleware/        # Auth, RBAC, validación
│   │   ├── services/          # Integraciones externas
│   │   └── db/                # Schema Drizzle + migraciones
│   └── tests/                 # Tests Jest + Supertest
│
├── frontend/
│   └── agenda-frontend/       # React + TypeScript
│       ├── src/
│       │   ├── routes/        # Páginas TanStack Router
│       │   ├── components/    # Componentes reutilizables
│       │   ├── hooks/         # Custom hooks
│       │   └── store/         # Zustand stores
│       └── tests/             # Tests Vitest + Testing Library
│
├── docs/                      # Documentación técnica
│   ├── ARCHITECTURE.md        # Arquitectura del sistema
│   ├── CONVENTIONS.md         # Convenciones de código
│   └── VERIFICATION.md        # Guía de verificación
│
├── progress/                  # Estado del proyecto
│   ├── current.md            # Sesión actual
│   ├── history.md            # Historial
│   ├── impl_*.md             # Documentación de implementaciones
│   └── review_*.md           # Reportes de revisiones
│
├── .claude/agents/            # Definiciones de agentes IA
│   ├── orchestrator.md       # Agente líder
│   ├── builder.md            # Agente implementador
│   └── reviewer.md           # Agente revisor
│
├── AGENTS.md                  # Mapa de fases del proyecto
├── CHECKPOINTS.md             # Criterios de validación
├── feature_list.json          # Features y estado
└── init.sh                    # Script de verificación
```

## 🚀 Quick Start

### Prerrequisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm o pnpm
- Git

### Instalación

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd agenda-tracker
```

2. **Verificar estructura (Harness):**
```bash
bash init.sh
```

3. **Backend setup:**
```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npm run db:generate
npm run db:migrate

# Seed data (opcional)
npm run db:seed

# Iniciar servidor
npm run dev
```

4. **Frontend setup:**
```bash
cd frontend/agenda-frontend
pnpm install

# Configurar API URL en .env
echo "VITE_API_URL=http://localhost:3001" > .env

# Iniciar dev server
pnpm dev
```

5. **Acceder a la aplicación:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Drizzle Studio: `npm run db:studio` (desde backend/)

## 📋 Features del Proyecto

Ver `feature_list.json` para el listado completo de features y su estado actual.

### Features Principales

- **F01:** Base de Datos (9 tablas, migraciones, seed)
- **F02:** Autenticación JWT + OAuth
- **F03:** CRUD Áreas y Usuarios
- **F04:** CRUD Capacitaciones y Registros
- **F05-F07:** Frontend Base (Layout, Auth, Dashboard)
- **F08:** **Combo Dependiente (CRÍTICO)** - Formulario crear capacitación
- **F09:** Integraciones Externas (Calendarios + Email)
- **F10-F11:** Dashboards y Reportes
- **F12:** Testing
- **F13:** Deployment

## 🧪 Testing

### Backend
```bash
cd backend

# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

### Frontend
```bash
cd frontend/agenda-frontend

# Tests unitarios
pnpm test

# Tests E2E
pnpm run test:e2e

# Coverage
pnpm run test:coverage
```

## 📖 Documentación

### Para Desarrolladores

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura completa del sistema
- [CONVENTIONS.md](docs/CONVENTIONS.md) - Convenciones de código
- [VERIFICATION.md](docs/VERIFICATION.md) - Guía de verificación

### Para Agentes IA

- [AGENTS.md](AGENTS.md) - Mapa de fases y flujo de trabajo
- [CHECKPOINTS.md](CHECKPOINTS.md) - Criterios de validación por feature
- [.claude/agents/](. claude/agents/) - Definiciones detalladas de roles

### Especificación Técnica

Consulta el archivo de especificación técnica original:
`C:\Users\Programador\Documents\files\ESPECIFICACION_TECNICA_DEFINITIVA.md`

## 🔄 Workflow de Desarrollo (Harness)

1. **Orchestrator** lee `feature_list.json` y selecciona próxima feature
2. **Orchestrator** invoca a **Builder** con instrucciones claras
3. **Builder** implementa y documenta en `progress/impl_<feature>.md`
4. **Orchestrator** invoca a **Reviewer** para validar
5. **Reviewer** valida contra `CHECKPOINTS.md` y crea `progress/review_<feature>.md`
6. Si aprobado: **Orchestrator** marca feature como `done` en `feature_list.json`
7. Si rechazado: **Orchestrator** solicita correcciones a **Builder**

Ver [AGENTS.md](AGENTS.md) para detalles completos del workflow.

## 🎓 Principios de Harness Engineering

1. **Repositorio como sistema:** La verdad está en los archivos, no en el chat
2. **Estado persistente:** Todo se escribe a disco antes de comunicar
3. **Orquestación multi-agente:** Un agente, una responsabilidad
4. **Validación continua:** Cada implementación pasa por revisión
5. **Documentación sincronizada:** El código y la doc evolucionan juntos
6. **Checkpoints claros:** Criterios de aceptación verificables

## 👥 Roles de Usuario

1. **Usuario Regular:**
   - Ver capacitaciones disponibles
   - Registrarse a capacitaciones
   - Ver mis capacitaciones

2. **Capacitador:**
   - Dictar capacitaciones
   - Marcar asistencia

3. **Jefe de Área:**
   - Crear capacitaciones para su área
   - Ver dashboard del área
   - Gestionar personal del área
   - Marcar asistencia

4. **Admin:**
   - Acceso total al sistema
   - Gestionar usuarios, roles, áreas
   - Ver todos los reportes

## 🔐 Seguridad

- Autenticación JWT con expiración
- OAuth 2.0 para Google y Microsoft
- RBAC (Role-Based Access Control) granular
- Validación de entrada con ZOD
- Contraseñas hasheadas con bcrypt
- Protección contra SQL injection (Drizzle ORM)

## 📊 Base de Datos

### Tablas Principales
- `areas` - 4 áreas de la empresa
- `usuarios` - ~100 usuarios
- `capacitaciones` - Eventos de capacitación
- `registros_capacitacion` - Relación M2M usuarios-capacitaciones

### RBAC
- `roles` - 4 roles base
- `permisos` - Permisos granulares
- `role_permisos` - M2M roles-permisos
- `usuarios_roles` - M2M usuarios-roles
- `auditoria_roles` - Log de cambios

## 🚀 Deployment

Ver `docs/DEPLOYMENT.md` (será creado en Feature F13)

## 📝 Estado del Proyecto

**Progreso actual:** Ver `progress/current.md`

**Features completadas:** Ver `feature_list.json` → metadata.completed

**Última actualización:** 2026-05-20

## 🤝 Contributing

Este proyecto usa arquitectura Harness Subagentes. Para contribuir:

1. Lee [AGENTS.md](AGENTS.md) para entender el flujo
2. Lee [CONVENTIONS.md](docs/CONVENTIONS.md) para las convenciones
3. Sigue el workflow: Implementar → Documentar → Revisar
4. Todos los checkpoints deben pasar (ver [CHECKPOINTS.md](CHECKPOINTS.md))

## 📄 Licencia

[Definir licencia]

## 📧 Contacto

[Definir contacto]

---

**Versión:** 1.0
**Timeline:** 12 semanas
**Estado:** En desarrollo (Feature F00 completada)
