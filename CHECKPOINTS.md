# ✅ CHECKPOINTS - Criterios de Validación

## Propósito

Este documento define **criterios de aceptación verificables** para cada feature del proyecto. Los agentes revisores usarán estos checkpoints para validar implementaciones antes de marcar features como completadas.

---

## 🎯 Principios de Validación

1. **Verificable**: Cada checkpoint debe poder probarse de forma objetiva
2. **Específico**: No usar términos ambiguos como "funciona bien"
3. **Documentado**: Incluir ejemplos de entrada/salida esperados
4. **Automatizable**: Preferir tests sobre validación manual

---

## 📋 Checkpoints por Feature

### F00: Setup Inicial y Arquitectura Harness

**Criterios de Aceptación:**
- [ ] Existe `AGENTS.md` con descripción completa de fases
- [ ] Existe `feature_list.json` con todas las features definidas
- [ ] Existe `CHECKPOINTS.md` (este archivo)
- [ ] Existe `init.sh` ejecutable
- [ ] Existe directorio `progress/`
- [ ] Existe directorio `docs/` con `ARCHITECTURE.md`
- [ ] Existe directorio `.claude/agents/` con definiciones de roles

**Comando de Verificación:**
```bash
bash init.sh
```

**Salida Esperada:** "✅ All checks passed"

---

### F01: Base de Datos - Schema y Migraciones

**Criterios de Aceptación:**
- [ ] Archivo `backend/drizzle.config.ts` existe y está correctamente configurado
- [ ] Archivo `backend/src/db/schema.ts` define las 9 tablas:
  - areas
  - usuarios
  - capacitaciones
  - registros_capacitacion
  - roles
  - permisos
  - role_permisos
  - usuarios_roles
  - auditoria_roles
- [ ] Todas las relaciones foreign key están definidas
- [ ] Migraciones se ejecutan sin errores
- [ ] Script de seed crea datos de ejemplo:
  - 4 áreas (Desarrollo, Operaciones, QA, Product Manager)
  - Al menos 10 usuarios distribuidos en las áreas
  - 4 roles (usuario, capacitador, jefe_area, admin)
  - Permisos básicos asignados a roles

**Comandos de Verificación:**
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

**Validaciones SQL:**
```sql
SELECT COUNT(*) FROM areas; -- Debe ser 4
SELECT COUNT(*) FROM usuarios; -- Debe ser >= 10
SELECT COUNT(*) FROM roles; -- Debe ser 4
SELECT * FROM usuarios WHERE area_id = 1; -- Debe devolver usuarios del área Desarrollo
```

---

### F02: Backend - Autenticación JWT + OAuth

**Criterios de Aceptación:**
- [ ] Endpoint `POST /api/auth/register` funciona
  - Valida email único
  - Hashea contraseñas con bcrypt
  - Devuelve JWT válido
- [ ] Endpoint `POST /api/auth/login` funciona
  - Valida credenciales
  - Devuelve JWT + refresh token
- [ ] Endpoint `POST /api/auth/google` implementado
- [ ] Endpoint `POST /api/auth/outlook` implementado
- [ ] Endpoint `POST /api/auth/refresh` renueva tokens
- [ ] Middleware `auth.js` verifica JWT correctamente
- [ ] Variables de entorno configuradas en `.env`

**Tests de Integración:**
```bash
# Registro exitoso
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","nombre":"Test","apellido":"User","area_id":1}'

# Login exitoso
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Respuesta esperada: { "token": "jwt...", "refreshToken": "...", "user": {...} }
```

---

### F03: Backend - CRUD Áreas y Usuarios

**Criterios de Aceptación:**
- [ ] `GET /api/areas` devuelve lista de áreas
- [ ] `GET /api/areas/:id` devuelve detalles de área específica
- [ ] **⭐ `GET /api/areas/:id/personal` devuelve usuarios del área (CRUCIAL)**
- [ ] `POST /api/areas` crea área (solo admin)
- [ ] `PUT /api/areas/:id` actualiza área (solo admin)
- [ ] `GET /api/usuarios` lista usuarios (con paginación)
- [ ] `GET /api/usuarios/:id` devuelve perfil de usuario
- [ ] `PUT /api/usuarios/:id` actualiza usuario
- [ ] Middleware RBAC valida permisos correctamente
- [ ] Validaciones ZOD rechazan datos inválidos

**Test Crítico - Endpoint Personal:**
```bash
# Obtener personal del área Desarrollo (ID=1)
curl -X GET http://localhost:3001/api/areas/1/personal \
  -H "Authorization: Bearer <token>"

# Respuesta esperada:
{
  "success": true,
  "data": [
    { "id": 1, "nombre": "Juan", "apellido": "Pérez", "email": "juan@example.com", "area_id": 1, "roles": ["jefe_area"] },
    { "id": 2, "nombre": "María", "apellido": "García", "email": "maria@example.com", "area_id": 1, "roles": ["capacitador"] }
  ]
}
```

**Validación RBAC:**
```bash
# Usuario sin permisos intenta crear área
curl -X POST http://localhost:3001/api/areas \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nueva Área"}'

# Respuesta esperada: 403 Forbidden
```

---

### F04: Backend - CRUD Capacitaciones y Registros

**Criterios de Aceptación:**
- [ ] `GET /api/capacitaciones` devuelve lista con filtros (área, estado, fecha)
- [ ] `GET /api/capacitaciones/:id` devuelve detalles completos
- [ ] `GET /api/areas/:id/capacitaciones` filtra por área
- [ ] `POST /api/capacitaciones` crea capacitación con validaciones:
  - Nombre: 5-255 caracteres
  - Fecha >= hoy
  - Duración > 0
  - Capacitador pertenece al área
  - Max participantes >= 5
- [ ] `PUT /api/capacitaciones/:id` actualiza (solo capacitador/admin)
- [ ] `DELETE /api/capacitaciones/:id` cancela capacitación
- [ ] `POST /api/capacitaciones/:id/registrar` registra usuario
  - Valida no registro duplicado
  - Valida lugares disponibles
  - Valida capacitación no cancelada
- [ ] `DELETE /api/capacitaciones/:id/registrar/:usuario_id` desregistra
- [ ] `PUT /api/capacitaciones/:id/registrar/:usuario_id/asistencia` marca asistencia
- [ ] `GET /api/usuarios/:id/capacitaciones` lista capacitaciones de usuario

**Test de Validación:**
```bash
# Crear capacitación válida
curl -X POST http://localhost:3001/api/capacitaciones \
  -H "Authorization: Bearer <jefe_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Capacitación Bitácora v2.0",
    "descripcion": "Sistema de gestión actualizado",
    "area_id": 1,
    "capacitador_id": 2,
    "fecha": "2026-06-15",
    "hora_inicio": "10:00",
    "duracion_minutos": 90,
    "plataforma": "Bitácora",
    "max_participantes": 20
  }'

# Respuesta esperada: 201 Created con capacitación creada
```

**Test de Registro Duplicado:**
```bash
# Primer registro (debe funcionar)
curl -X POST http://localhost:3001/api/capacitaciones/1/registrar \
  -H "Authorization: Bearer <user_token>"

# Segundo registro del mismo usuario (debe fallar)
curl -X POST http://localhost:3001/api/capacitaciones/1/registrar \
  -H "Authorization: Bearer <user_token>"

# Respuesta esperada: 409 Conflict "Ya estás registrado en esta capacitación"
```

---

### F05: Frontend - Setup, Router y Layout

**Criterios de Aceptación:**
- [ ] TanStack Router configurado correctamente
- [ ] TanStack Query configurado con QueryClientProvider
- [ ] Zustand store para autenticación creado
- [ ] Axios configurado con interceptors para JWT
- [ ] Componente `Navbar` renderiza correctamente
- [ ] Componente `Sidebar` renderiza con navegación
- [ ] Componente `Footer` renderiza
- [ ] Navegación entre rutas funciona
- [ ] Layout se aplica a todas las páginas protegidas

**Test Visual:**
```bash
cd frontend/agenda-frontend
npm run dev
```

Abrir http://localhost:3000 y verificar:
- [ ] Layout se muestra correctamente
- [ ] Navbar tiene logo y menú de usuario
- [ ] Sidebar tiene enlaces de navegación
- [ ] Footer se muestra en la parte inferior

---

### F06: Frontend - Autenticación (Login, Register, OAuth)

**Criterios de Aceptación:**
- [ ] Página `/login` renderiza formulario
- [ ] Formulario valida email y password
- [ ] Login exitoso guarda token y redirige a `/dashboard`
- [ ] Login fallido muestra mensaje de error
- [ ] Página `/register` funciona
- [ ] OAuth Google redirige correctamente
- [ ] OAuth Outlook redirige correctamente
- [ ] Hook `useAuth` expone: `user`, `login`, `logout`, `isAuthenticated`
- [ ] Logout limpia token y redirige a `/login`
- [ ] Rutas protegidas redirigen a `/login` si no autenticado

**Test de Flujo:**
1. Ir a `/dashboard` sin autenticar → redirige a `/login`
2. Llenar formulario de login con credenciales válidas
3. Hacer clic en "Iniciar sesión"
4. Verificar redirección a `/dashboard`
5. Verificar que token está guardado en localStorage
6. Hacer clic en "Cerrar sesión"
7. Verificar redirección a `/login` y token eliminado

---

### F07: Frontend - Dashboard Personal y Lista Capacitaciones

**Criterios de Aceptación:**
- [ ] Página `/dashboard` muestra resumen del usuario:
  - Próximas capacitaciones
  - Capacitaciones completadas
  - Capacitaciones donde estoy registrado
- [ ] Página `/capacitaciones` lista todas las capacitaciones disponibles
- [ ] Filtros por área, fecha, estado funcionan
- [ ] TanStack Table implementado con paginación
- [ ] Página `/capacitaciones/:id` muestra detalles completos
- [ ] Botón "Registrarme" aparece si usuario no registrado
- [ ] Botón muestra "Ya registrado" si usuario ya está registrado
- [ ] Hook `useCapacitaciones` implementado con React Query

**Test Visual:**
```bash
npm run dev
```

1. Login como usuario regular
2. Ir a `/dashboard` → verificar resumen
3. Ir a `/capacitaciones` → verificar lista
4. Aplicar filtro por área → verificar resultados
5. Hacer clic en una capacitación → verificar detalles
6. Hacer clic en "Registrarme" → verificar registro exitoso

---

### F08: Frontend - Formulario Crear Capacitación (Combo Dependiente) ⭐

**FEATURE MÁS CRÍTICA DEL PROYECTO**

**Criterios de Aceptación:**
- [ ] Página `/capacitaciones/crear` solo accesible para jefes/admin
- [ ] Componente `SelectArea` renderiza dropdown con 4 áreas
- [ ] Al seleccionar área, se dispara `onChange` que:
  1. Llama a `GET /api/areas/:id/personal`
  2. Recibe lista de usuarios del área
  3. Filtra usuarios con rol de capacitador o jefe
  4. Actualiza el estado del componente `SelectCapacitador`
- [ ] Componente `SelectCapacitador` se llena dinámicamente
- [ ] Combo de capacitadores está deshabilitado hasta que se seleccione área
- [ ] Formulario valida todos los campos con ZOD
- [ ] Submit crea capacitación y redirige a `/capacitaciones/:id`
- [ ] TanStack Form implementado
- [ ] Mensajes de error claros para cada campo

**Test de Validación - Combo Dependiente:**

1. Ir a `/capacitaciones/crear`
2. Verificar que combo de capacitadores está deshabilitado (disabled)
3. Seleccionar "Desarrollo" en combo de áreas
4. Verificar que se hace fetch a `GET /api/areas/1/personal`
5. Verificar que combo de capacitadores se habilita
6. Verificar que combo muestra solo usuarios de Desarrollo con rol capacitador/jefe
7. Cambiar área a "QA"
8. Verificar que combo de capacitadores se actualiza con usuarios de QA
9. Completar formulario y enviar
10. Verificar capacitación creada con área y capacitador correctos

**Código de Referencia (debe implementarse similar a esto):**
```typescript
const [areaId, setAreaId] = useState<number | null>(null);
const [capacitadores, setCapacitadores] = useState<Usuario[]>([]);

const handleAreaChange = async (id: number) => {
  setAreaId(id);
  const response = await api.get(`/areas/${id}/personal`);
  const filtered = response.data.filter(u =>
    u.roles.includes('capacitador') || u.roles.includes('jefe_area')
  );
  setCapacitadores(filtered);
};
```

---

### F09: Backend - Integraciones Externas (Calendarios + Email)

**Criterios de Aceptación:**
- [ ] Servicio `calendar-sync.service.js` implementado
- [ ] Al crear capacitación, se crea evento en Google Calendar
- [ ] Al crear capacitación, se crea evento en Outlook Calendar
- [ ] `google_calendar_event_id` y `outlook_calendar_event_id` se guardan en BD
- [ ] Al actualizar capacitación, se actualizan eventos en calendarios
- [ ] Al cancelar capacitación, se cancelan eventos en calendarios
- [ ] Al registrarse usuario, se envía email de confirmación
- [ ] Si usuario tiene OAuth Google, se agrega evento a su calendario personal
- [ ] Si usuario tiene OAuth Outlook, se agrega evento a su calendario personal
- [ ] Recordatorios automáticos 24h y 1h antes
- [ ] Variables de entorno configuradas:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `SENDGRID_API_KEY` o `RESEND_API_KEY`

**Test de Integración:**
```bash
# Crear capacitación y verificar sincronización
curl -X POST http://localhost:3001/api/capacitaciones \
  -H "Authorization: Bearer <jefe_token>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Verificar en respuesta:
{
  "success": true,
  "data": {
    "id": 1,
    "google_calendar_event_id": "abc123...",
    "outlook_calendar_event_id": "xyz789...",
    ...
  }
}

# Verificar manualmente en Google Calendar y Outlook que el evento se creó
```

---

### F10: Frontend - Dashboard Jefe de Área

**Criterios de Aceptación:**
- [ ] Página `/dashboard/area` solo accesible para jefes
- [ ] Muestra resumen del área:
  - Total de personal
  - Total de capacitaciones del área
  - Próximas capacitaciones
- [ ] Componente `PersonalTable` lista empleados del área
- [ ] Tabla es sorteable y filtrable
- [ ] Página `/capacitaciones/:id/asistencia` permite marcar asistencia
- [ ] Solo el capacitador o jefe puede marcar asistencia
- [ ] Checkbox por cada participante registrado
- [ ] Botón "Guardar asistencia" actualiza registros

**Test Visual:**
1. Login como jefe de área
2. Ir a `/dashboard/area`
3. Verificar resumen del área
4. Verificar tabla de personal con todos los empleados del área
5. Ir a una capacitación del área
6. Hacer clic en "Marcar asistencia"
7. Marcar algunos participantes como presentes
8. Guardar y verificar actualización

---

### F11: Backend - Dashboard y Reportes

**Criterios de Aceptación:**
- [ ] `GET /api/dashboard/area/:id` devuelve:
  - Total personal
  - Total capacitaciones
  - Próximas capacitaciones (fecha >= hoy)
  - Lista de personal con sus últimas capacitaciones
  - Estadísticas de asistencia
- [ ] `GET /api/dashboard/usuario` devuelve:
  - Capacitaciones registradas
  - Próximas capacitaciones
  - Capacitaciones completadas
  - Historial de asistencia
- [ ] Queries optimizadas (sin N+1)
- [ ] Respuestas incluyen datos agregados

**Test:**
```bash
# Dashboard de área
curl -X GET http://localhost:3001/api/dashboard/area/1 \
  -H "Authorization: Bearer <jefe_token>"

# Respuesta esperada:
{
  "success": true,
  "data": {
    "area": { "id": 1, "nombre": "Desarrollo" },
    "stats": {
      "totalPersonal": 3,
      "totalCapacitaciones": 5,
      "proximasCapacitaciones": 2
    },
    "personal": [...],
    "capacitaciones": [...]
  }
}
```

---

### F12: Testing - Unit, Integration, E2E

**Criterios de Aceptación:**
- [ ] Backend: Tests unitarios para controllers (Jest)
- [ ] Backend: Tests de integración para endpoints (Supertest)
- [ ] Backend: Coverage >= 70%
- [ ] Frontend: Tests de componentes (Vitest + Testing Library)
- [ ] Frontend: Tests de hooks (React Testing Library)
- [ ] Frontend: Tests E2E críticos (Playwright):
  - Login flow
  - Crear capacitación flow
  - Registro a capacitación flow
- [ ] Todos los tests pasan en CI

**Comandos:**
```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend/agenda-frontend
npm test
npm run test:e2e
```

---

### F13: Deployment - VPS + CI/CD

**Criterios de Aceptación:**
- [ ] VPS configurado con Docker
- [ ] Base de datos PostgreSQL en producción
- [ ] Backend deployed y accesible
- [ ] Frontend deployed y accesible
- [ ] SSL/HTTPS configurado
- [ ] Variables de entorno en producción configuradas
- [ ] CI/CD pipeline con GitHub Actions
- [ ] Migraciones automáticas en deploy
- [ ] Logs centralizados
- [ ] Monitoreo básico (uptime)
- [ ] Documento `DEPLOYMENT.md` con instrucciones

**Validación en Producción:**
```bash
# Verificar backend
curl https://api.capacitaciones.example.com/health

# Verificar frontend
curl https://capacitaciones.example.com
```

---

## 🔄 Proceso de Revisión

Cuando un **Implementador** completa una feature:

1. Escribe `progress/impl_<feature_id>.md` con detalles
2. Notifica al **Líder**
3. **Líder** invoca al **Revisor** con referencia al archivo
4. **Revisor** verifica TODOS los checkpoints de esta lista
5. **Revisor** escribe `progress/review_<feature_id>.md`:
   - ✅ Checkpoints pasados
   - ❌ Checkpoints fallados (con detalles)
   - Recomendaciones
6. Si todos los checkpoints pasan: **Líder** marca feature como `done`
7. Si fallan checkpoints: **Líder** reinicia ciclo con feedback

---

## 📊 Métricas de Calidad

Cada feature debe cumplir:
- ✅ 100% de checkpoints pasados
- ✅ Código sin errores de lint
- ✅ Documentación actualizada
- ✅ Tests escritos y pasando

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo
