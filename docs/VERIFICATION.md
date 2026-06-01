# ✅ Guía de Verificación

## Propósito

Este documento explica cómo verificar que cada feature está correctamente implementada. Es una guía práctica para el agente **reviewer** y para pruebas manuales.

---

## 🔍 Tipos de Verificación

### 1. Verificación Estática (Sin ejecutar)

- Revisar código contra convenciones
- Verificar imports y exports
- Comprobar tipos TypeScript
- Revisar comentarios y documentación

### 2. Verificación Dinámica (Ejecutar código)

- Ejecutar tests automatizados
- Probar endpoints con curl/Postman
- Probar UI manualmente
- Verificar interacciones de BD

### 3. Verificación de Integración

- Flujos completos end-to-end
- Sincronización con servicios externos
- Performance bajo carga

---

## 🛠️ Herramientas de Verificación

### Backend

```bash
# 1. Linting
npm run lint

# 2. Tests unitarios
npm test

# 3. Tests de integración
npm test:integration

# 4. Coverage
npm run test:coverage

# 5. Type checking (si usa TypeScript)
npm run type-check

# 6. Servidor de desarrollo
npm run dev
```

### Frontend

```bash
# 1. Linting
npm run lint

# 2. Type checking
npm run type-check

# 3. Tests
npm test

# 4. Tests E2E
npm run test:e2e

# 5. Build (verificar que compila)
npm run build

# 6. Servidor de desarrollo
npm run dev
```

### Database

```bash
# 1. Conectar a BD
psql -U postgres -d capacitaciones

# 2. Verificar tablas
\dt

# 3. Contar registros
SELECT table_name, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total FROM information_schema.tables WHERE table_schema = 'public';

# 4. Verificar relaciones
\d usuarios
\d capacitaciones

# 5. Query de prueba
SELECT u.nombre, a.nombre as area
FROM usuarios u
JOIN areas a ON u.area_id = a.id;
```

---

## 📋 Checklist por Feature

### F01: Base de Datos - Schema y Migraciones

**Verificaciones Estáticas:**
```bash
# Ver archivo de schema
cat backend/src/db/schema.ts

# Ver migraciones
ls -la backend/src/db/migrations/
```

**Verificaciones Dinámicas:**
```bash
# Generar migraciones
cd backend && npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Abrir Drizzle Studio para inspeccionar
npm run db:studio
```

**Queries de Verificación:**
```sql
-- Contar tablas (debe ser 9)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar áreas (debe ser 4)
SELECT * FROM areas;

-- Verificar relaciones
SELECT
  u.nombre,
  u.apellido,
  a.nombre as area
FROM usuarios u
JOIN areas a ON u.area_id = a.id;

-- Verificar roles (debe ser 4)
SELECT * FROM roles;

-- Verificar permisos
SELECT r.nombre as rol, p.codigo as permiso
FROM roles r
JOIN role_permisos rp ON r.id = rp.rol_id
JOIN permisos p ON rp.permiso_id = p.id
ORDER BY r.nombre, p.codigo;
```

**Criterio de Éxito:**
- ✅ 9 tablas creadas
- ✅ 4 áreas insertadas
- ✅ >= 10 usuarios insertados
- ✅ 4 roles con permisos asignados
- ✅ Relaciones FK funcionando

---

### F02: Backend - Autenticación JWT + OAuth

**Verificaciones Estáticas:**
```bash
# Verificar archivos existen
ls backend/src/routes/auth.js
ls backend/src/controllers/authController.js
ls backend/src/middleware/auth.js
ls backend/src/services/auth.service.js
```

**Verificaciones Dinámicas:**
```bash
# Iniciar servidor
cd backend && npm run dev

# En otra terminal:

# 1. Registro exitoso
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "Verify123!",
    "nombre": "Test",
    "apellido": "User",
    "area_id": 1
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": { "id": ..., "email": "verify@example.com", ... }
# }

# 2. Login exitoso
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "Verify123!"
  }'

# 3. Login con credenciales incorrectas (debe fallar)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "WrongPassword"
  }'

# Respuesta esperada: 401 Unauthorized

# 4. Registro con email duplicado (debe fallar)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "Another123!",
    "nombre": "Another",
    "apellido": "User",
    "area_id": 1
  }'

# Respuesta esperada: 409 Conflict
```

**Verificación de BD:**
```sql
-- Verificar usuario creado
SELECT email, nombre, apellido FROM usuarios WHERE email = 'verify@example.com';

-- Verificar contraseña hasheada (debe empezar con $2b$ o $2a$)
SELECT password FROM usuarios WHERE email = 'verify@example.com';
```

**Tests Automatizados:**
```bash
cd backend && npm test -- auth.test.js
```

**Criterio de Éxito:**
- ✅ POST /api/auth/register funciona
- ✅ POST /api/auth/login funciona
- ✅ Contraseñas hasheadas en BD
- ✅ Email duplicado rechazado
- ✅ JWT válido devuelto
- ✅ Todos los tests pasan

---

### F03: Backend - CRUD Áreas y Usuarios

**Endpoint Crítico: GET /api/areas/:id/personal**

```bash
# Obtener token primero
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@example.com","password":"Verify123!"}' \
  | jq -r '.token')

# Probar endpoint personal
curl -X GET http://localhost:3001/api/areas/1/personal \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# {
#   "success": true,
#   "data": [
#     { "id": 1, "nombre": "Juan", "apellido": "Pérez", "area_id": 1, ... },
#     { "id": 2, "nombre": "María", "apellido": "García", "area_id": 1, ... }
#   ]
# }
```

**Otros Endpoints:**
```bash
# Listar todas las áreas
curl -X GET http://localhost:3001/api/areas \
  -H "Authorization: Bearer $TOKEN"

# Obtener área específica
curl -X GET http://localhost:3001/api/areas/1 \
  -H "Authorization: Bearer $TOKEN"

# Listar usuarios
curl -X GET http://localhost:3001/api/usuarios \
  -H "Authorization: Bearer $TOKEN"

# Obtener usuario específico
curl -X GET http://localhost:3001/api/usuarios/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Verificar RBAC:**
```bash
# Intentar crear área sin permisos (debe fallar)
curl -X POST http://localhost:3001/api/areas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nueva Área"}'

# Respuesta esperada: 403 Forbidden (si el usuario no es admin)
```

**Criterio de Éxito:**
- ✅ GET /api/areas devuelve 4 áreas
- ✅ GET /api/areas/:id/personal devuelve usuarios del área
- ✅ RBAC bloquea acciones no autorizadas
- ✅ Validaciones rechazan datos inválidos

---

### F08: Frontend - Combo Dependiente (CRÍTICO)

**Verificación Manual (Paso a Paso):**

1. **Abrir navegador:**
   ```bash
   cd frontend/agenda-frontend && npm run dev
   ```
   Ir a http://localhost:3000

2. **Login:**
   - Email: `verify@example.com`
   - Password: `Verify123!`

3. **Navegar a crear capacitación:**
   - Click en menú "Capacitaciones"
   - Click en "Crear Capacitación"
   - URL debe ser `/capacitaciones/crear`

4. **Verificar combo deshabilitado:**
   - El combo "Capacitador" debe estar **disabled** (gris)
   - No debe permitir seleccionar

5. **Seleccionar área:**
   - Abrir combo "Área"
   - Seleccionar "Desarrollo"

6. **Verificar fetch automático:**
   - Abrir DevTools (F12) → Network tab
   - Debe aparecer request: `GET /api/areas/1/personal`
   - Verificar que devuelve usuarios

7. **Verificar combo habilitado:**
   - El combo "Capacitador" ahora debe estar **enabled**
   - Debe mostrar solo usuarios de Desarrollo con rol capacitador/jefe

8. **Cambiar área:**
   - Seleccionar "QA" en combo de áreas
   - Verificar nuevo request: `GET /api/areas/3/personal`
   - Verificar que combo de capacitadores se actualiza con usuarios de QA

9. **Completar formulario:**
   - Llenar todos los campos
   - Click en "Crear"
   - Verificar que se crea la capacitación con área y capacitador correctos

**Verificación con React DevTools:**
```
1. Instalar React DevTools extension
2. Abrir DevTools → Components tab
3. Seleccionar componente <CrearCapacitacion>
4. Verificar estados:
   - areaId: null → 1 (al seleccionar)
   - personal: [] → [{ id: 1, ... }, ...]
   - capacitadores: filtrado correcto
```

**Código a Revisar:**
```typescript
// Debe existir lógica similar a esta:
const [areaId, setAreaId] = useState<number | null>(null);
const { data: personal } = useAreaPersonal(areaId);

const capacitadores = personal?.filter(u =>
  u.roles.includes('capacitador') || u.roles.includes('jefe_area')
) ?? [];

const handleAreaChange = (newAreaId: number) => {
  setAreaId(newAreaId);
  // El combo de capacitadores se actualiza automáticamente
};
```

**Criterio de Éxito:**
- ✅ Combo capacitador inicia deshabilitado
- ✅ Al seleccionar área, se hace fetch a `/api/areas/:id/personal`
- ✅ Combo capacitador se habilita y se llena
- ✅ Combo muestra solo usuarios del área con rol apropiado
- ✅ Al cambiar área, combo se actualiza
- ✅ Formulario crea capacitación correctamente

---

## 🧪 Tests Automatizados

### Backend - Ejemplo de Test de Integración

```javascript
describe('Feature F03: CRUD Áreas y Usuarios', () => {
  let token;

  beforeAll(async () => {
    // Login para obtener token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    token = response.body.token;
  });

  describe('GET /api/areas/:id/personal', () => {
    it('debe devolver personal del área Desarrollo', async () => {
      const response = await request(app)
        .get('/api/areas/1/personal')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('area_id', 1);
    });

    it('debe fallar sin autenticación', async () => {
      await request(app)
        .get('/api/areas/1/personal')
        .expect(401);
    });

    it('debe retornar 404 si área no existe', async () => {
      await request(app)
        .get('/api/areas/999/personal')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
```

### Frontend - Ejemplo de Test de Componente

```typescript
describe('SelectCapacitador', () => {
  it('debe estar deshabilitado si no hay capacitadores', () => {
    render(
      <SelectCapacitador
        value={null}
        onChange={() => {}}
        capacitadores={[]}
        disabled={false}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('debe mostrar capacitadores del área', () => {
    const capacitadores = [
      { id: 1, nombre: 'Juan', apellido: 'Pérez' },
      { id: 2, nombre: 'María', apellido: 'García' }
    ];

    render(
      <SelectCapacitador
        value={null}
        onChange={() => {}}
        capacitadores={capacitadores}
        disabled={false}
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
  });
});
```

---

## 📊 Métricas de Calidad

Cada feature debe cumplir:

| Métrica | Target | Cómo Verificar |
|---------|--------|----------------|
| Test Coverage | >= 70% | `npm run test:coverage` |
| Tests Pasando | 100% | `npm test` |
| Lint Errors | 0 | `npm run lint` |
| Type Errors | 0 | `npm run type-check` |
| Build Errors | 0 | `npm run build` |
| Endpoints Funcionando | 100% | Tests de integración |
| Checkpoints Pasados | 100% | Revisión manual |

---

## 🚨 Señales de Alerta

Si durante la verificación encuentras:

- 🔴 **Tests fallan:** NO APROBAR, reportar errores
- 🔴 **Endpoints no responden:** NO APROBAR
- 🔴 **Errores de tipo/lint:** NO APROBAR
- 🟡 **Performance lento:** Reportar, considerar aprobar
- 🟡 **Falta documentación:** Solicitar mejora
- 🟢 **Todo funciona:** APROBAR

---

## 📝 Template de Reporte de Verificación

```markdown
# Verificación: <Feature ID> - <Feature Name>

**Fecha:** YYYY-MM-DD
**Reviewer:** Nombre

## Verificaciones Realizadas

### Estáticas
- [x] Archivos existen
- [x] Código sigue convenciones
- [x] Tipos completos

### Dinámicas
- [x] Tests pasan (X/X)
- [x] Endpoints funcionan
- [x] UI renderiza correctamente

### Integración
- [x] Flujo completo funciona
- [x] BD actualizada correctamente

## Problemas Encontrados
Ninguno / [Lista de problemas]

## Decisión
✅ APROBADO / ❌ NECESITA CORRECCIONES
```

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo
