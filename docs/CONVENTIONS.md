# 📘 Convenciones de Código

## Propósito

Este documento define las convenciones de código que todos los agentes (builder, reviewer) deben seguir al implementar features del proyecto.

---

## 🎨 Estilo General

### Principios

1. **Consistencia:** Código uniforme en todo el proyecto
2. **Legibilidad:** Nombres claros, estructuras simples
3. **Type Safety:** TypeScript en frontend, JSDoc en backend
4. **Testing:** Cada feature incluye tests

---

## 📝 Naming Conventions

### Variables y Funciones

```javascript
// ✅ BIEN: camelCase
const userId = 123;
const areaPersonal = [];
async function getUserById(id) { }
function handleAreaChange(event) { }

// ❌ MAL
const user_id = 123;           // snake_case (usar en BD, no en código)
const AreaPersonal = [];       // PascalCase (solo para clases/componentes)
async function get_user(id) {} // snake_case
```

### Constantes

```javascript
// ✅ BIEN: UPPER_SNAKE_CASE
const MAX_PARTICIPANTES = 50;
const JWT_SECRET = process.env.JWT_SECRET;
const API_BASE_URL = 'http://localhost:3001';

// ❌ MAL
const maxParticipantes = 50;   // Parece variable
const jwtSecret = process.env.JWT_SECRET;
```

### Clases y Componentes

```typescript
// ✅ BIEN: PascalCase
class UserService { }
function SelectArea() { }
class NotFoundError extends Error { }

// ❌ MAL
class userService { }
function selectArea() { }
```

### Archivos

```
Backend:
✅ areasController.js
✅ calendar-sync.service.js
✅ auth.middleware.js
❌ AreasController.js (PascalCase solo para componentes React)
❌ calendar_sync_service.js (snake_case)

Frontend:
✅ SelectArea.tsx (componentes)
✅ useAuth.ts (hooks)
✅ api.ts (utilities)
❌ select-area.tsx (kebab-case)
❌ UseAuth.ts (PascalCase para hooks)
```

### Rutas (TanStack Router)

```
✅ src/routes/login.tsx
✅ src/routes/dashboard.tsx
✅ src/routes/capacitaciones/index.tsx
✅ src/routes/capacitaciones/$id.tsx
✅ src/routes/capacitaciones/crear.tsx
❌ src/routes/Login.tsx
❌ src/routes/capacitaciones/[id].tsx (Next.js syntax)
```

---

## 🔧 Backend Conventions

### Estructura de Archivos

```javascript
// Orden de imports
import express from 'express';              // 1. Node modules
import { db } from '../db/index.js';        // 2. Internal modules
import { authenticate } from '../middleware/auth.js';
import { areasTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';          // 3. External libraries

const router = express.Router();

// 4. Route definitions
router.get('/', authenticate, getAreas);
router.get('/:id', authenticate, getAreaById);

export default router;
```

### Controllers

```javascript
// Estructura estándar de un controller
export async function getAreaById(req, res) {
  try {
    const { id } = req.params;

    // 1. Validar entrada
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    // 2. Query a BD
    const area = await db
      .select()
      .from(areasTable)
      .where(eq(areasTable.id, parseInt(id)))
      .limit(1);

    // 3. Validar resultado
    if (!area || area.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // 4. Respuesta exitosa
    return res.status(200).json({
      success: true,
      data: area[0]
    });
  } catch (error) {
    // 5. Manejo de errores
    console.error('Error en getAreaById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}
```

### Respuestas API

**Formato estándar:**
```javascript
// ✅ BIEN: Formato consistente
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa" // opcional
}

{
  "success": false,
  "message": "Error descriptivo",
  "errors": [ ... ] // opcional, para validaciones
}

// ❌ MAL: Inconsistente
{
  "ok": true,
  "result": { ... }
}

{
  "error": "Something failed"
}
```

### Status Codes

```javascript
// ✅ BIEN: Usar códigos HTTP apropiados
200 OK              // GET exitoso, UPDATE exitoso
201 Created         // POST exitoso (nuevo recurso)
204 No Content      // DELETE exitoso
400 Bad Request     // Validación fallida
401 Unauthorized    // No autenticado
403 Forbidden       // No autorizado (sin permisos)
404 Not Found       // Recurso no existe
409 Conflict        // Conflicto (ej: email duplicado)
500 Internal Error  // Error del servidor

// ❌ MAL
200 OK con { success: false } // Inconsistente
```

### Queries Drizzle

```javascript
// ✅ BIEN: Type-safe, readable
const usuarios = await db
  .select()
  .from(usuariosTable)
  .where(eq(usuariosTable.areaId, areaId))
  .orderBy(usuariosTable.nombre);

// ❌ MAL: SQL crudo (solo si Drizzle no puede hacerlo)
const usuarios = await db.execute(
  `SELECT * FROM usuarios WHERE area_id = ${areaId}`
);
```

### Validaciones

```javascript
// ✅ BIEN: Con ZOD
import { z } from 'zod';

const createCapacitacionSchema = z.object({
  nombre: z.string().min(5).max(255),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_participantes: z.number().min(5)
});

export function validateCreateCapacitacion(req, res, next) {
  try {
    createCapacitacionSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      errors: error.errors
    });
  }
}

// ❌ MAL: Validación manual propensa a errores
if (!req.body.nombre || req.body.nombre.length < 5) {
  return res.status(400).json({ error: 'Nombre inválido' });
}
```

---

## ⚛️ Frontend Conventions

### Componentes React

```typescript
// ✅ BIEN: Componente funcional con TypeScript
import { useState } from 'react';

interface SelectAreaProps {
  value: number | null;
  onChange: (areaId: number) => void;
  disabled?: boolean;
}

export function SelectArea({ value, onChange, disabled = false }: SelectAreaProps) {
  const { data: areas, isLoading } = useAreas();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(parseInt(e.target.value))}
      disabled={disabled}
      className="w-full p-2 border rounded"
    >
      <option value="">Seleccionar área</option>
      {areas?.map((area) => (
        <option key={area.id} value={area.id}>
          {area.nombre}
        </option>
      ))}
    </select>
  );
}

// ❌ MAL: Sin tipos, sin props interface
export function SelectArea(props) {
  return <select onChange={props.onChange}>...</select>;
}
```

### Custom Hooks

```typescript
// ✅ BIEN: Hook con TanStack Query
import { useQuery } from '@tanstack/react-query';
import { api } from '#/lib/api';

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get('/areas');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

export function useAreaPersonal(areaId: number | null) {
  return useQuery({
    queryKey: ['areas', areaId, 'personal'],
    queryFn: async () => {
      if (!areaId) return [];
      const response = await api.get(`/areas/${areaId}/personal`);
      return response.data.data;
    },
    enabled: !!areaId // Solo ejecutar si areaId existe
  });
}

// ❌ MAL: Fetch manual sin cache
export function useAreas() {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    fetch('/api/areas')
      .then(r => r.json())
      .then(setAreas);
  }, []);

  return areas;
}
```

### State Management

```typescript
// ✅ BIEN: Zustand store
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

// ❌ MAL: Context API para estado global simple
```

### Event Handlers

```typescript
// ✅ BIEN: Nombres descriptivos
function handleAreaChange(areaId: number) { }
function handleSubmit(event: FormEvent) { }
function handleDeleteClick(id: number) { }

// ❌ MAL
function onChange() { }         // Poco descriptivo
function onAreaChange() { }     // Usar "handle" no "on"
function clickDelete() { }      // Orden incorrecto
```

### Conditional Rendering

```typescript
// ✅ BIEN: Ternarios para render alternativo
return isLoading ? <Spinner /> : <Content />;

// ✅ BIEN: && para render condicional
return (
  <div>
    {error && <ErrorMessage error={error} />}
    {data && <DataTable data={data} />}
  </div>
);

// ❌ MAL: Ternarios anidados
return isLoading ? <Spinner /> :
       error ? <Error /> :
       data ? <Content /> : null;
```

---

## 🧪 Testing Conventions

### Backend Tests

```javascript
// Estructura de test
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/areas/:id/personal', () => {
  let token;

  beforeAll(async () => {
    // Setup: Autenticar
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    token = response.body.token;
  });

  it('debe devolver personal del área', async () => {
    const response = await request(app)
      .get('/api/areas/1/personal')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('debe fallar sin autenticación', async () => {
    await request(app)
      .get('/api/areas/1/personal')
      .expect(401);
  });
});
```

### Frontend Tests

```typescript
// Componente test
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectArea } from './SelectArea';

describe('SelectArea', () => {
  it('debe renderizar lista de áreas', () => {
    render(<SelectArea value={null} onChange={() => {}} />);

    expect(screen.getByText('Seleccionar área')).toBeInTheDocument();
  });

  it('debe llamar onChange cuando se selecciona área', () => {
    const onChange = jest.fn();
    render(<SelectArea value={null} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
```

---

## 📁 Imports Organization

```typescript
// 1. React y hooks
import { useState, useEffect } from 'react';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal modules (usar alias #)
import { useAuth } from '#/hooks/useAuth';
import { api } from '#/lib/api';
import { Button } from '#/components/ui/button';

// 4. Types
import type { User, Area } from '#/types';

// 5. Styles (al final)
import './styles.css';
```

---

## 🚫 Anti-Patterns

### NO hacer:

```javascript
// ❌ Callbacks anidados (callback hell)
db.query('...', (err, result) => {
  db.query('...', (err2, result2) => {
    db.query('...', (err3, result3) => {
      // ...
    });
  });
});

// ✅ Usar async/await
const result = await db.query('...');
const result2 = await db.query('...');
const result3 = await db.query('...');
```

```javascript
// ❌ Mutación directa de estado
const user = { ...state.user };
user.name = 'New name';
setState({ user });

// ✅ Inmutable
setState({ user: { ...state.user, name: 'New name' } });
```

```javascript
// ❌ Magic numbers
if (user.age >= 18) { }

// ✅ Constantes con nombre
const LEGAL_AGE = 18;
if (user.age >= LEGAL_AGE) { }
```

---

## 📝 Comentarios y Documentación

### Cuándo comentar:

```javascript
// ✅ BIEN: Explicar por qué, no qué
// Usar bcrypt con 10 rounds: balance entre seguridad y performance
const hash = await bcrypt.hash(password, 10);

// Sincronizar con Google Calendar antes de guardar en BD
// para asegurar que el event_id sea válido
const googleEventId = await syncGoogleCalendar(data);
```

### Cuándo NO comentar:

```javascript
// ❌ MAL: Comentario obvio
// Obtener usuario por ID
const user = await getUserById(id);

// ❌ MAL: Código comentado (eliminar)
// const oldFunction = () => { ... }

// ❌ MAL: TODO sin contexto
// TODO: fix this
```

### JSDoc para funciones complejas:

```javascript
/**
 * Crea una capacitación y sincroniza con calendarios externos
 *
 * @param {Object} data - Datos de la capacitación
 * @param {number} data.area_id - ID del área
 * @param {number} data.capacitador_id - ID del capacitador
 * @param {string} data.fecha - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Object>} Capacitación creada con event_ids
 * @throws {ValidationError} Si los datos son inválidos
 * @throws {NotFoundError} Si el área o capacitador no existen
 */
export async function createCapacitacion(data) {
  // ...
}
```

---

## 🔒 Seguridad

### NUNCA:

```javascript
// ❌ SQL Injection
db.execute(`SELECT * FROM usuarios WHERE email = '${email}'`);

// ❌ Contraseñas en texto plano
const user = { email, password };

// ❌ Secrets en código
const API_KEY = 'sk-1234567890abcdef';

// ❌ Eval
eval(userInput);
```

### SIEMPRE:

```javascript
// ✅ Usar ORM con prepared statements
const users = await db.select().from(usersTable).where(eq(usersTable.email, email));

// ✅ Hashear contraseñas
const hash = await bcrypt.hash(password, 10);

// ✅ Variables de entorno
const API_KEY = process.env.SENDGRID_API_KEY;

// ✅ Validar y sanitizar input
const sanitized = validator.escape(userInput);
```

---

## 📊 Performance

```javascript
// ❌ N+1 queries
for (const user of users) {
  const capacitaciones = await getCapacitaciones(user.id);
}

// ✅ Query único con join
const usersWithCapacitaciones = await db
  .select()
  .from(usersTable)
  .leftJoin(capacitacionesTable, eq(usersTable.id, capacitacionesTable.userId));
```

```typescript
// ❌ Re-render innecesario
<Component data={areas.map(a => a.id)} />

// ✅ Memoizar
const areaIds = useMemo(() => areas.map(a => a.id), [areas]);
<Component data={areaIds} />
```

---

## ✅ Checklist Pre-Commit

Antes de marcar una feature como completa:

- [ ] Código sigue naming conventions
- [ ] Imports organizados
- [ ] Sin console.log (excepto en desarrollo)
- [ ] Sin código comentado
- [ ] Errores manejados apropiadamente
- [ ] Types completos (TypeScript)
- [ ] Tests escritos y pasando
- [ ] No hay warnings de lint
- [ ] Documentación actualizada

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo
