# 🤖 AGENTS - Mapa Progresivo de Instrucciones

## 📋 Índice de Fases del Proyecto

Este documento sirve como **mapa de navegación** para los agentes de IA que trabajarán en el proyecto de forma autónoma y verificable.

---

## 🎯 Contexto del Proyecto

**Proyecto:** Plataforma de Agendas para Capacitaciones
**Stack:** Node.js + Express + React + TypeScript + PostgreSQL
**Usuarios:** ~100 usuarios activos en 4 áreas
**Timeline:** 12 semanas (3 meses)

**Problema a resolver:**
Sistema centralizado para gestionar capacitaciones por área, con sincronización automática a calendarios (Google Calendar + Outlook), notificaciones por email, control de acceso por roles (RBAC), y reportes de asistencia.

---

## 🏗️ Arquitectura Multi-Agente

### Roles Definidos

1. **Líder (orchestrator)**: Orquesta el plan general, coordina subagentes, NO edita código
2. **Implementador (builder)**: Ejecuta cambios de código, escribe en `progress/impl_<feature>.md`
3. **Revisor (reviewer)**: Valida contra documentación y checkpoints, crea `progress/review_<feature>.md`

### Patrón de Trabajo

```
Líder → Planifica → Implementador → Ejecuta → Revisor → Valida → Líder → Siguiente feature
```

---

## 📦 Fases del Proyecto (Features Iterativas)

### **FASE 0: Setup Inicial** ✅
- Configurar estructura del proyecto
- Crear arquitectura harness subagentes
- Definir feature_list.json
- Documentación base

### **FASE 1: Base de Datos y Migraciones** (Semana 1-2)
- Crear schemas con Drizzle ORM
- Implementar migraciones
- Datos de semilla (4 áreas, usuarios iniciales)
- Verificar relaciones y constraints

**Archivos clave:**
- `backend/src/db/schema.ts`
- `backend/drizzle.config.ts`
- `backend/src/db/migrations/`

### **FASE 2: Backend - Autenticación** (Semana 3)
- JWT authentication
- OAuth 2.0 Google
- OAuth 2.0 Microsoft
- Middleware de autenticación
- Endpoints: `/api/auth/*`

**Archivos clave:**
- `backend/src/routes/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/middleware/auth.js`
- `backend/src/services/auth.service.js`

### **FASE 3: Backend - CRUD Áreas y Usuarios** (Semana 3-4)
- Endpoints de áreas
- Endpoints de usuarios
- Endpoint CRUCIAL: `GET /api/areas/:id/personal`
- Middleware RBAC
- Validaciones con ZOD

**Archivos clave:**
- `backend/src/routes/areas.js`
- `backend/src/routes/usuarios.js`
- `backend/src/middleware/rbac.js`

### **FASE 4: Backend - CRUD Capacitaciones** (Semana 4-5)
- Endpoints capacitaciones
- Validaciones de negocio
- Control de conflictos de horarios
- Endpoints de registros (M2M)

**Archivos clave:**
- `backend/src/routes/capacitaciones.js`
- `backend/src/controllers/capacitacionesController.js`

### **FASE 5: Frontend - Setup y Layout** (Semana 5)
- Configurar TanStack Router
- Crear componentes de layout (Navbar, Sidebar, Footer)
- Configurar TanStack Query
- Store con Zustand
- Configuración de Axios

**Archivos clave:**
- `frontend/agenda-frontend/src/router.tsx`
- `frontend/agenda-frontend/src/components/layout/`
- `frontend/agenda-frontend/src/lib/api.ts`
- `frontend/agenda-frontend/src/store/authStore.ts`

### **FASE 6: Frontend - Autenticación** (Semana 5)
- Página de login
- Página de registro
- Callbacks OAuth
- Hooks de autenticación

**Archivos clave:**
- `frontend/agenda-frontend/src/routes/login.tsx`
- `frontend/agenda-frontend/src/hooks/useAuth.ts`

### **FASE 7: Frontend - Dashboard y Listados** (Semana 6)
- Dashboard personal
- Lista de capacitaciones
- Filtros y búsqueda
- TanStack Table

**Archivos clave:**
- `frontend/agenda-frontend/src/routes/dashboard.tsx`
- `frontend/agenda-frontend/src/routes/capacitaciones/index.tsx`

### **FASE 8: Frontend - Componente Crítico: Combo Dependiente** (Semana 6)
⭐ **COMPONENTE MÁS IMPORTANTE DEL PROYECTO**

Crear formulario de capacitaciones con:
- SelectArea (dropdown de áreas)
- SelectCapacitador (combo dependiente que se llena según área seleccionada)
- Lógica: onChange de área → fetch personal → filtrar capacitadores

**Archivos clave:**
- `frontend/agenda-frontend/src/components/SelectArea.tsx`
- `frontend/agenda-frontend/src/components/SelectCapacitador.tsx`
- `frontend/agenda-frontend/src/routes/capacitaciones/crear.tsx`
- `frontend/agenda-frontend/src/hooks/useAreas.ts`

### **FASE 9: Backend - Integraciones Externas** (Semana 7)
- Google Calendar API
- Microsoft Graph API (Outlook)
- Servicio de email (SendGrid/Resend)
- Sincronización bidireccional

**Archivos clave:**
- `backend/src/services/calendar-sync.service.js`
- `backend/src/services/email.service.js`

### **FASE 10: Frontend - Dashboard Jefe de Área** (Semana 7-8)
- Dashboard específico para jefes
- Tabla de personal del área
- Gestión de capacitaciones del área
- Marcar asistencia

**Archivos clave:**
- `frontend/agenda-frontend/src/routes/dashboard/area.tsx`
- `frontend/agenda-frontend/src/components/PersonalTable.tsx`

### **FASE 11: Backend - Reportes y Auditoría** (Semana 8)
- Endpoints de dashboard
- Reportes de asistencia
- Logs de auditoría

### **FASE 12: Testing y QA** (Semana 9-10)
- Tests unitarios backend
- Tests de integración
- Tests e2e frontend
- Corrección de bugs

### **FASE 13: Deployment** (Semana 11-12)
- Configurar VPS
- CI/CD
- Variables de entorno producción
- SSL/HTTPS
- Documentación de deployment

---

## 🔄 Ciclo de Trabajo por Feature

Para cada feature en `feature_list.json`:

1. **Líder** lee la feature actual
2. **Líder** invoca al **Implementador** con instrucciones claras
3. **Implementador** escribe código y documenta en `progress/impl_<feature>.md`
4. **Líder** invoca al **Revisor** con referencia al archivo de implementación
5. **Revisor** valida contra `CHECKPOINTS.md` y crea `progress/review_<feature>.md`
6. Si pasa validación: **Líder** marca feature como `done` en `feature_list.json`
7. Si falla: **Líder** reinicia el ciclo con feedback del revisor

---

## 📊 Estado Persistente

Todo el estado vive en disco, NO en el chat:

- `progress/current.md` - Plan vivo de la sesión actual
- `progress/history.md` - Bitácora append-only de todas las sesiones
- `progress/impl_*.md` - Documentación de implementaciones
- `progress/review_*.md` - Reportes de revisiones
- `feature_list.json` - Estado de cada feature (pending/in_progress/done)

---

## 🎓 Principios de Harness Engineering

1. **Repositorio como sistema**: La verdad está en los archivos, no en el chat
2. **Estado persistente**: Todo se escribe a disco antes de comunicar
3. **Orquestación multi-agente**: Un agente, una responsabilidad
4. **Validación continua**: Cada implementación pasa por revisión
5. **Documentación sincronizada**: El código y la doc evolucionan juntos
6. **Checkpoints claros**: Criterios de aceptación verificables

---

## 🚀 Comenzar a Trabajar

**Líder, cuando estés listo:**

1. Lee `feature_list.json` para ver la próxima feature
2. Lee `docs/ARCHITECTURE.md` para entender el contexto técnico
3. Lee `CHECKPOINTS.md` para conocer los criterios de validación
4. Invoca al subagente apropiado (implementador o revisor)
5. Actualiza `progress/current.md` con el estado actual
6. Al terminar la feature, actualiza `feature_list.json` y `progress/history.md`

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo
