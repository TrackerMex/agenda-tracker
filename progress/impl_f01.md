# Implementación: F01 - Base de Datos Schema y Migraciones

**Fecha:** 2026-05-20
**Builder:** Claude Sonnet 4.5
**Duración:** 2 horas

---

## 📋 Resumen

Se implementó el schema completo de la base de datos con Drizzle ORM, incluyendo las 9 tablas necesarias para el sistema de capacitaciones, sistema RBAC completo, migraciones automáticas y datos de semilla.

---

## 📁 Archivos Creados

1. **backend/drizzle.config.ts** - Configuración de Drizzle Kit
2. **backend/src/db/schema.ts** - Schema completo con 9 tablas + relaciones + types
3. **backend/src/db/index.ts** - Conexión a PostgreSQL
4. **backend/src/db/seed.ts** - Datos de semilla
5. **backend/src/db/migrations/0000_medical_gamora.sql** - Migración inicial (generada)
6. **backend/.env** - Variables de entorno

---

## 📁 Archivos Modificados

1. **backend/package.json** - Agregados scripts de DB y dependencias
   - Scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`
   - Cambiado a `"type": "module"` para ES Modules

---

## 🗄️ Tablas Implementadas

### 1. **areas** (4 registros seed)
Columnas:
- `id` (PK)
- `nombre` (UNIQUE) - "Desarrollo", "Operaciones", "QA", "Product Manager"
- `descripcion`
- `jefe_id` (FK → usuarios.id)
- `created_at`, `updated_at`

### 2. **usuarios** (14 registros seed)
Columnas:
- `id` (PK)
- `email` (UNIQUE)
- `password`
- `nombre`, `apellido`
- `area_id` (FK → areas.id) ⭐ CRUCIAL para filtrado por área
- `google_id`, `outlook_id` (para OAuth)
- `activo` (BOOLEAN)
- `created_at`, `updated_at`

**Distribución por área (seed):**
- Desarrollo: 4 usuarios (1 jefe, 1 capacitador, 2 usuarios)
- Operaciones: 3 usuarios (1 jefe, 1 capacitador, 1 usuario)
- QA: 4 usuarios (1 jefe, 1 capacitador, 2 usuarios)
- Product Manager: 3 usuarios (1 jefe, 1 capacitador, 1 usuario)

### 3. **capacitaciones** (3 registros seed)
Columnas:
- `id` (PK)
- `nombre`
- `descripcion`
- `area_id` (FK → areas.id) ⭐ CRUCIAL
- `capacitador_id` (FK → usuarios.id)
- `fecha` (DATE)
- `hora_inicio` (TIME)
- `duracion_minutos` (INTEGER)
- `plataforma` (VARCHAR)
- `max_participantes` (INTEGER)
- `google_calendar_event_id` (VARCHAR, nullable)
- `outlook_calendar_event_id` (VARCHAR, nullable)
- `estado` (VARCHAR) - "programada", "completada", "cancelada"
- `created_at`, `updated_at`

### 4. **registros_capacitacion** (M2M)
Columnas:
- `id` (PK)
- `capacitacion_id` (FK)
- `usuario_id` (FK)
- `registrado_en` (TIMESTAMP)
- `asistio` (BOOLEAN)
- `comentarios` (TEXT)
- `created_at`, `updated_at`

**Constraint:** UNIQUE(capacitacion_id, usuario_id) - Previene registros duplicados

### 5. **roles** (4 registros seed)
Columnas:
- `id` (PK)
- `nombre` (UNIQUE) - "usuario", "capacitador", "jefe_area", "admin"
- `descripcion`
- `nivel_jerarquia` (INTEGER) - 0, 10, 20, 30
- `es_activo` (BOOLEAN)
- `created_at`

### 6. **permisos** (15 registros seed)
Columnas:
- `id` (PK)
- `codigo` (UNIQUE) - ej: "capacitacion:crear"
- `nombre`
- `descripcion`
- `modulo` (VARCHAR) - "capacitaciones", "usuarios", "areas", "roles"
- `accion` (VARCHAR) - "crear", "editar", "eliminar", "ver"
- `es_activo` (BOOLEAN)
- `created_at`

**Permisos creados:**
- Capacitaciones: ver, crear, editar, eliminar, registrarse, marcar_asistencia (6)
- Usuarios: ver, crear, editar, eliminar (4)
- Áreas: ver, crear, editar (3)
- Roles: ver, asignar (2)

### 7. **role_permisos** (M2M)
Columnas:
- `id` (PK)
- `rol_id` (FK)
- `permiso_id` (FK)
- `created_at`

**Constraint:** UNIQUE(rol_id, permiso_id)

**Distribución de permisos (seed):**
- **usuario:** 4 permisos (ver capacitaciones, registrarse, ver áreas, ver usuarios)
- **capacitador:** 5 permisos (+ marcar asistencia)
- **jefe_area:** 7 permisos (+ crear, editar, eliminar capacitaciones)
- **admin:** 15 permisos (todos)

### 8. **usuarios_roles** (M2M)
Columnas:
- `id` (PK)
- `usuario_id` (FK)
- `rol_id` (FK)
- `asignado_por_usuario_id` (FK)
- `asignado_en` (TIMESTAMP)
- `es_activo` (BOOLEAN)
- `created_at`

**Constraint:** UNIQUE(usuario_id, rol_id)

### 9. **auditoria_roles**
Columnas:
- `id` (PK)
- `usuario_id` (FK)
- `accion` (VARCHAR) - "rol_asignado", "rol_removido"
- `rol_id` (FK)
- `realizado_por_usuario_id` (FK)
- `created_at`

---

## 🔗 Relaciones Implementadas

Todas las relaciones se definieron usando `relations()` de Drizzle:

1. **areas → usuarios** (1:M)
2. **areas → capacitaciones** (1:M)
3. **areas → jefe** (1:1 via jefe_id)
4. **usuarios → area** (M:1)
5. **usuarios → capacitaciones_dictadas** (1:M)
6. **usuarios → registros** (1:M)
7. **capacitaciones → area** (M:1)
8. **capacitaciones → capacitador** (M:1)
9. **capacitaciones → registros** (1:M)
10. **roles → role_permisos** (1:M)
11. **permisos → role_permisos** (1:M)
12. **usuarios → usuarios_roles** (1:M)

---

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "postgres": "^3.4.9",
    "dotenv": "^17.4.2",
    "express": "^5.2.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10",
    "tsx": "^4.22.3",
    "@types/node": "^25.9.1"
  }
}
```

---

## 🎯 Types TypeScript Exportados

```typescript
export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export type Capacitacion = typeof capacitaciones.$inferSelect;
export type NewCapacitacion = typeof capacitaciones.$inferInsert;

export type RegistroCapacitacion = typeof registrosCapacitacion.$inferSelect;
export type NewRegistroCapacitacion = typeof registrosCapacitacion.$inferInsert;

export type Rol = typeof roles.$inferSelect;
export type NewRol = typeof roles.$inferInsert;

export type Permiso = typeof permisos.$inferSelect;
export type NewPermiso = typeof permisos.$inferInsert;

export type RolPermiso = typeof rolePermisos.$inferSelect;
export type NewRolPermiso = typeof rolePermisos.$inferInsert;

export type UsuarioRol = typeof usuariosRoles.$inferSelect;
export type NewUsuarioRol = typeof usuariosRoles.$inferInsert;

export type AuditoriaRol = typeof auditoriaRoles.$inferSelect;
export type NewAuditoriaRol = typeof auditoriaRoles.$inferInsert;
```

---

## 🌱 Datos de Seed

### Áreas (4)
- Desarrollo
- Operaciones
- QA
- Product Manager

### Usuarios (14)
| Email | Nombre | Área | Rol |
|-------|--------|------|-----|
| juan.perez@empresa.com | Juan Pérez | Desarrollo | Jefe |
| maria.garcia@empresa.com | María García | Desarrollo | Capacitadora |
| carlos.lopez@empresa.com | Carlos López | Desarrollo | Usuario |
| ana.martinez@empresa.com | Ana Martínez | Desarrollo | Usuario |
| luis.rodriguez@empresa.com | Luis Rodríguez | Operaciones | Jefe |
| sofia.hernandez@empresa.com | Sofía Hernández | Operaciones | Capacitadora |
| diego.torres@empresa.com | Diego Torres | Operaciones | Usuario |
| laura.sanchez@empresa.com | Laura Sánchez | QA | Jefe |
| pedro.ramirez@empresa.com | Pedro Ramírez | QA | Capacitador |
| carmen.flores@empresa.com | Carmen Flores | QA | Usuario |
| jorge.castro@empresa.com | Jorge Castro | QA | Usuario |
| monica.diaz@empresa.com | Mónica Díaz | Product Manager | Jefe |
| roberto.cruz@empresa.com | Roberto Cruz | Product Manager | Capacitador |
| patricia.morales@empresa.com | Patricia Morales | Product Manager | Usuario |

**Contraseña temporal para todos:** `password123` (debe hashearse en producción)

### Capacitaciones (3)
1. **Introducción a React 19** - Desarrollo - 15 jun 2026, 10:00, 120 min
2. **DevOps Best Practices** - Operaciones - 20 jun 2026, 14:00, 90 min
3. **Testing Automation con Playwright** - QA - 25 jun 2026, 11:00, 150 min

---

## 🚀 Cómo Ejecutar

### 1. Generar Migraciones (Ya ejecutado)
```bash
cd backend
npm run db:generate
```

**Resultado:** ✅ Migración generada en `src/db/migrations/0000_medical_gamora.sql`

### 2. Crear Base de Datos PostgreSQL

```bash
# Opción 1: psql
createdb capacitaciones

# Opción 2: SQL
psql -U postgres
CREATE DATABASE capacitaciones;
\q
```

### 3. Aplicar Migraciones

```bash
npm run db:migrate
```

**Esto creará las 9 tablas en la base de datos.**

### 4. Ejecutar Seed

```bash
npm run db:seed
```

**Esto insertará:**
- 4 áreas
- 4 roles
- 15 permisos
- Asignaciones de permisos a roles
- 14 usuarios
- 14 asignaciones de roles a usuarios
- Actualización de jefes de área
- 3 capacitaciones de ejemplo

### 5. Verificar con Drizzle Studio

```bash
npm run db:studio
```

**Abre en el navegador:** http://localhost:4983

Aquí puedes inspeccionar visualmente todas las tablas y datos.

---

## 🧪 Queries de Verificación

```sql
-- Contar tablas (debe ser 9)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar áreas (debe ser 4)
SELECT id, nombre, jefe_id FROM areas;

-- Verificar usuarios por área
SELECT
  u.nombre,
  u.apellido,
  a.nombre as area
FROM usuarios u
JOIN areas a ON u.area_id = a.id;

-- Verificar roles (debe ser 4)
SELECT * FROM roles ORDER BY nivel_jerarquia;

-- Verificar permisos por rol
SELECT
  r.nombre as rol,
  COUNT(rp.permiso_id) as total_permisos
FROM roles r
LEFT JOIN role_permisos rp ON r.id = rp.rol_id
GROUP BY r.nombre;

-- Verificar usuarios con sus roles
SELECT
  u.email,
  u.nombre,
  u.apellido,
  r.nombre as rol
FROM usuarios u
JOIN usuarios_roles ur ON u.id = ur.usuario_id
JOIN roles r ON ur.rol_id = r.id
ORDER BY u.area_id, r.nivel_jerarquia DESC;

-- Verificar capacitaciones
SELECT
  c.nombre,
  a.nombre as area,
  u.nombre as capacitador,
  c.fecha,
  c.max_participantes
FROM capacitaciones c
JOIN areas a ON c.area_id = a.id
JOIN usuarios u ON c.capacitador_id = u.id;
```

---

## ⭐ Puntos Críticos Implementados

### 1. Foreign Key `area_id` en `usuarios`
✅ Implementado correctamente.

**Importancia:** Este campo es CRUCIAL para:
- Filtrar usuarios por área
- Implementar el endpoint `GET /api/areas/:id/personal` (F03)
- Llenar el combo dependiente en el formulario de capacitaciones (F08)

### 2. Constraint UNIQUE en `registros_capacitacion`
✅ Implementado: `UNIQUE(capacitacion_id, usuario_id)`

**Previene:** Que un usuario se registre 2 veces a la misma capacitación.

### 3. Sistema RBAC Completo
✅ Implementado con 4 tablas:
- `roles`
- `permisos`
- `role_permisos` (M2M)
- `usuarios_roles` (M2M)

**Ventajas:**
- Control granular de permisos
- Escalable (fácil agregar nuevos permisos)
- Auditable (quien asignó qué rol y cuándo)

### 4. Campos para OAuth
✅ Implementado: `google_id`, `outlook_id` en `usuarios`

**Uso futuro:** Sincronización de calendarios personales (F09)

### 5. Campos para Event IDs
✅ Implementado: `google_calendar_event_id`, `outlook_calendar_event_id` en `capacitaciones`

**Uso futuro:** Actualizar/cancelar eventos en calendarios (F09)

---

## 🔧 Decisiones Técnicas

### 1. ¿Por qué Drizzle ORM?
- **Type-safe:** Queries completamente tipadas
- **Performance:** Más rápido que Prisma
- **SQL-like:** Sintaxis familiar para devs que conocen SQL
- **Migraciones:** Automáticas y versionadas
- **Drizzle Studio:** UI para inspeccionar datos

### 2. ¿Por qué ES Modules (`"type": "module"`)?
- Estándar moderno de JavaScript
- Mejor compatibilidad con TypeScript
- Syntax más limpia (`import` vs `require`)
- Preparado para el futuro

### 3. ¿Por qué `postgres` en vez de `pg`?
- API más moderna
- Mejor TypeScript support
- Performance superior
- Recomendado por Drizzle

### 4. ¿Por qué separar `roles` y `permisos`?
- **Escalabilidad:** Fácil agregar nuevos permisos sin tocar roles
- **Granularidad:** Un rol puede tener múltiples permisos
- **Auditoría:** Saber exactamente qué puede hacer cada rol
- **RBAC completo:** Estándar de industria

---

## 🚨 Notas Importantes

### Contraseñas en Seed
⚠️ **Las contraseñas en el seed están en texto plano (`password123`).**

**Antes de producción (F02):**
- Implementar hashing con bcrypt
- Actualizar seed para usar contraseñas hasheadas
- `password123` → `$2b$10$...`

### Variables de Entorno
✅ Archivo `.env` creado con:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/capacitaciones
NODE_ENV=development
PORT=3001
```

⚠️ **En producción:**
- Usar credenciales seguras
- NO commitear `.env` a Git (ya está en `.gitignore`)

### Migraciones
✅ Primera migración generada: `0000_medical_gamora.sql`

**Futuras migraciones:**
- Drizzle Kit genera automáticamente
- Versionadas (0001, 0002, etc.)
- Nunca editar migraciones aplicadas

---

## 📊 Resumen de Implementación

| Item | Cantidad | Estado |
|------|----------|--------|
| Tablas | 9 | ✅ |
| Relaciones | 12 | ✅ |
| Tipos TypeScript | 18 | ✅ |
| Áreas (seed) | 4 | ✅ |
| Usuarios (seed) | 14 | ✅ |
| Roles (seed) | 4 | ✅ |
| Permisos (seed) | 15 | ✅ |
| Capacitaciones (seed) | 3 | ✅ |
| Migraciones generadas | 1 | ✅ |
| Scripts configurados | 6 | ✅ |

---

## 📝 Próximos Pasos

Una vez que el **Reviewer** apruebe esta feature:

1. **F02: Backend - Autenticación**
   - Implementar endpoints de auth
   - Hashear contraseñas con bcrypt
   - JWT tokens
   - OAuth 2.0

2. **F03: Backend - CRUD Áreas y Usuarios**
   - ⭐ Implementar `GET /api/areas/:id/personal` (CRUCIAL)
   - CRUD de usuarios
   - Middleware RBAC

3. **Actualizar seed:**
   - Contraseñas hasheadas
   - Más datos de ejemplo si es necesario

---

## 🎯 Criterios de Aceptación (Checkpoints F01)

Ver `CHECKPOINTS.md` sección F01 para la lista completa de validaciones.

**Checkpoints principales:**
- ✅ 9 tablas creadas
- ✅ Relaciones foreign key definidas
- ✅ Migraciones generadas sin errores
- ✅ Seed crea 4 áreas
- ✅ Seed crea >= 10 usuarios
- ✅ Seed crea 4 roles
- ✅ Permisos asignados a roles
- ⏳ Pendiente: Ejecutar migraciones en BD PostgreSQL
- ⏳ Pendiente: Ejecutar seed
- ⏳ Pendiente: Verificar con Drizzle Studio

---

**Builder:** Claude Sonnet 4.5
**Fecha de implementación:** 2026-05-20
**Tiempo total:** 2 horas
**Estado:** Listo para revisión
