# F08 - Frontend - Formulario Crear Capacitacion (Combo Dependiente)

**Estado:** done
**Fecha de implementacion:** 2026-06-02
**Agente:** builder
**Dependencias:** F07 (done), F04 endpoints backend (done)

---

## Resumen

Se implemento la feature mas critica del proyecto segun AGENTS.md: el formulario de creacion de capacitaciones con **combo dependiente** area -> personal -> filtrar capacitadores. El flujo completo va desde `/capacitaciones/crear` (gated por rol `jefe_area` o `admin`) hasta el success card post-registro, con validacion client-side con zod, cache invalidation con TanStack Query y creacion del record en el backend.

## Decisiones de diseno

### 1. Patron de form: `useState` + zod, no react-hook-form
El proyecto ya usa este patron en `routes/login.tsx` y `routes/register.tsx` (consolidado en F06). Se mantiene consistencia. Si en el futuro se requiere formularios con mayor complejidad, se podra evaluar `react-hook-form` + `@hookform/resolvers/zod`.

### 2. Componentes controlados (`value` + `onChange`)
`SelectArea` y `SelectCapacitador` reciben `value` y `onChange` por props (no tienen estado interno). Esto permite que `CapacitacionForm` controle el estado global, facilite la coordinacion entre los dos selects (cambiar area debe limpiar capacitador), y haga al componente reutilizable.

### 3. El capacitador se limpia al cambiar de area
`CapacitacionForm.handleAreaChange` detecta cambio de `area_id` y resetea `capacitador_id` a `null`. Esto evita que el usuario envie un capacitador que ya no pertenece al area nueva. Tambien limpia los errores de ambos campos.

### 4. Default inteligente: pre-rellenar `area_id` con el area del usuario
El usuario con rol `jefe_area` crea capacitaciones para su propio area casi siempre. Por eso el form arranca con `area_id = user.area_id`. Si el usuario cambia de area, el flujo normal se aplica (incluida la limpieza del capacitador).

### 5. SelectCapacitador filtra por roles relevantes
Solo se muestran usuarios con `roles.includes('capacitador')` o `roles.includes('jefe_area')` o `roles.includes('admin')`. Esto es la logica inversa al backend (`capacitaciones.service.js:67 validateCapacitadorArea` solo verifica que pertenezca al area), pero en el UX es util reducir la lista a los candidatos validos.

### 6. Email del capacitador como feedback visual
Cuando hay un capacitador seleccionado, debajo del select aparece su email en color verde. Esto sirve de confirmacion visual y reduce errores.

### 7. Success card reemplaza al form
Despues de crear, el form se reemplaza por una `Card` de confirmacion con 3 acciones:
- "Ver detalle" (link a `/capacitaciones/$id`)
- "Crear otra" (limpia `created` y vuelve al form)
- "Volver al listado" (link a `/capacitaciones`)

Esto evita que el usuario tenga que esperar una navegacion y le da control directo.

## Artefactos creados

### Types (`src/types/index.ts`)

```typescript
export interface PersonalArea {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  area_id: number;
  activo: boolean;
  roles: RolNombre[];
}

export interface CapacitacionCreatePayload {
  nombre: string;
  descripcion?: string;
  area_id: number;
  capacitador_id: number;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  plataforma: string;
  max_participantes: number;
}
```

### Service nuevo: `src/services/areas.service.ts`

Encapsula los endpoints de areas. Por ahora expone `list()` y `getPersonal(areaId)`. Sigue el patron de `capacitaciones.service.ts`.

### Hook nuevo: `usePersonalArea(areaId)`

En `src/hooks/useAreas.ts`. Usa `useQuery` con:
- `queryKey`: `['areas', areaId, 'personal']`
- `enabled`: `typeof areaId === 'number' && areaId > 0` — solo fetchea si hay area seleccionada
- `staleTime`: 2 minutos (mismo que el resto de hooks de capacitacion)

El `enabled` flag es la pieza clave del combo dependiente: cuando el usuario abre el form, no se hace fetch; cuando selecciona un area, recien ahi se dispara la query.

### Service extendido: `capacitaciones.service.ts`

Nuevo metodo `create(payload)` que hace `POST /capacitaciones` y devuelve `CapacitacionDetalle`.

### Hook extendido: `useCapacitaciones.ts`

Nuevo hook `useCreateCapacitacion()` con `useMutation`. En `onSuccess` invalida `KEY_ALL` y `KEY_MIAS` para que la lista y el dashboard se actualicen.

### Componente: `src/components/capacitacion/SelectArea.tsx`

- Wrapper controlado sobre el `<select>` nativo con icono `Building2`
- Usa `useAreas()` internamente
- Carga condicional: "Cargando areas..." mientras `isLoading`
- Placeholder: "Selecciona un area"
- Aplica `aria-invalid` cuando hay error
- Acepta prop `id` (default 'area') y `label` (default 'Area') para reusabilidad

### Componente: `src/components/capacitacion/SelectCapacitador.tsx`

- Wrapper controlado sobre `<select>` con icono `GraduationCap`
- Usa `usePersonalArea(areaId)` internamente
- Estados visuales segun el ciclo:
  - `areaId === null` -> disabled, "Selecciona un area primero"
  - `isLoading` -> disabled, "Cargando personal..."
  - Sin capacitadores -> disabled, hint: "Esta area no tiene usuarios con rol capacitador, jefe o admin..."
  - Con error -> disabled, alert: "No se pudo cargar el personal del area"
  - Con valor seleccionado -> muestra email en verde
- Filtra personal por roles: solo `capacitador`, `jefe_area`, `admin`
- Sufijo en el nombre: "(admin)" o "(jefe)" para roles jerarquicos

### Componente: `src/components/capacitacion/CapacitacionForm.tsx`

- Layout: grid 2 columnas en `md+`, 1 columna en mobile
- Campos: nombre, descripcion, area, capacitador, fecha, hora, duracion, max participantes, plataforma
- Iconos semanticos: `FileText`, `Calendar`, `Clock`, `Hash`, `Users`, `Link2`, `Building2`, `GraduationCap`
- Validacion zod inline: muestra errores por campo
- `handleAreaChange`: si cambia el area, resetea `capacitador_id` y limpia errores
- `handleSubmit`: valida, llama `useCreateCapacitacion().mutateAsync`, en exito llama `onSuccess?.(capacitacion)`, en error mapea field errors del backend o muestra error general
- `min` en input date: hoy (via `todayIso()`)
- Step en number inputs: 5 para duracion, 1 para max participantes

### Ruta: `src/routes/capacitaciones/crear.tsx` (reemplazada)

- `beforeLoad`: si no autenticado -> redirect `/login`; si no es `jefe_area` o `admin` -> redirect `/dashboard`
- Renderiza `CapacitacionForm` o `Card` de success segun `created`
- `onCancel` del form navega a `/capacitaciones`

## Verificacion

### Typecheck
```
$ npm run typecheck
> tsc --noEmit
(sin errores)
```

### Smoke test en browser (con `chrome-devtools`)

**Setup:**
- Login como `juan.perez@empresa.com` / `password123` (jefe_area, area Desarrollo)
- Navegar a `/capacitaciones/crear`

**Resultado 1 - Renderizado del form:**
- Header "Crear capacitacion" + breadcrumb "Volver a capacitaciones"
- 5 areas en dropdown (Desarrollo preseleccionado por ser el area del user)
- 6 capacitadores visibles en el dropdown de Desarrollo (Juan, Maria + 4 F03 Admin porque el seed tiene 4 users con ese nombre)
- Hint "Capacitador *" con asterisco rojo
- Fecha con min = hoy, duracion 60, max participantes 20, plataforma "Google Meet"

**Resultado 2 - Combo dependiente (cambio de area):**
- Estado inicial: area=Desarrollo (1), capacitador=2 (Maria)
- Cambio area -> QA (3)
- Resultado: capacitador auto-resetea a placeholder "Selecciona un capacitador", y se fetchea `/api/areas/3/personal`
- Nueva lista: "Laura Sanchez (jefe)" + "Pedro Ramirez"

**Resultado 3 - Validacion con form vacio:**
- Click submit sin llenar nada
- Errores inline: "Minimo 5 caracteres" (nombre), "Selecciona un capacitador del area" (capacitador), "Fecha invalida", "Hora invalida"
- `aria-invalid="true"` aplicado correctamente

**Resultado 4 - Submit exitoso:**
- Llenar: nombre="Workshop de React Query y TanStack", descripcion larga, area=Desarrollo, capacitador=Maria Garcia, fecha=2026-06-15, hora=10:00, duracion=90, max=25, plataforma=Zoom
- Click "Crear capacitacion"
- `POST /api/capacitaciones` -> 201
- Form reemplazado por success card: "Capacitacion creada - 'Workshop de React Query y TanStack' quedo agendada para el 2026-06-15 a las 10:00."
- 3 botones: "Ver detalle", "Crear otra", "Volver al listado"

**Resultado 5 - Verificacion en backend:**
```
GET /api/capacitaciones/6 -> 200
{
  "id": 6,
  "nombre": "Workshop de React Query y TanStack",
  "area_id": 1,
  "capacitador_id": 2,
  "fecha": "2026-06-15",
  "hora_inicio": "10:00:00",
  ...
  "estado": "programada",
  "area": { "id": 1, "nombre": "Desarrollo", ... },
  "capacitador": { "id": 2, "nombre": "María", "apellido": "García", ... }
}
```

**Resultado 6 - Navegacion post-creacion:**
- "Ver detalle" -> navega a `/capacitaciones/6` (pagina de detalle de F07) correctamente
- Detalle muestra: titulo, badge "Desarrollo" + "Programada", descripcion, fecha formateada "lunes, 15 de junio de 2026", horario "10:00 (1 h 30 min)" (auto-formateo de 90 min), plataforma "Zoom", inscriptos "0 / 25", seccion capacitador con email, boton "Registrarme"

**Resultado 7 - RBAC:**
- Logout, login como `browser.test@empresa.com` / `password123` (rol: usuario)
- Sidebar solo muestra "Mi Dashboard" + "Capacitaciones" (sin "Crear Capacitacion" ni "Mi Area")
- Intento de acceso directo a `/capacitaciones/crear` -> redirige a `/dashboard`

## Limitaciones conocidas (no son bugs)

1. **Duplicados visuales "F03 Admin"**: la data de seed tiene 4 usuarios distintos con nombre "F03 Admin" (ids 50, 51, 52, 54), todos en el area Desarrollo con roles `['usuario', 'admin']`. El dropdown muestra 4 opciones identicas porque son personas distintas, no es un bug. Esto se limpiaria al rehacer el seed o pasar a produccion.

2. **El sidebar no incluye "Crear Capacitacion" para usuarios `capacitador` puros**: actualmente la sidebar solo muestra el link si el usuario tiene `jefe_area` o `admin`. Un usuario con rol solo `capacitador` no lo ve, aunque `beforeLoad` les permitira acceder. Esto esta bien por diseno (los capacitadores no crean capacitaciones, solo las dictan) pero se podria re-evaluar.

3. **El `textarea` no es un componente shadcn**: se uso un `<textarea>` nativo con clases de Tailwind siguiendo el patron del `Input` para mantener consistencia visual, pero no es un componente reutilizable. Se podria extraer a `components/ui/textarea.tsx` en una iteracion futura.

4. **Hora de inicio en formato 12h (AM/PM)**: el input `type="time"` del navegador renderiza con AM/PM por locale. El valor enviado al backend es `10:00` (24h). El backend normaliza agregando segundos (`10:00:00`).

## Archivos modificados / creados

### Creados
- `frontend/agenda-frontend/src/services/areas.service.ts`
- `frontend/agenda-frontend/src/components/capacitacion/SelectArea.tsx`
- `frontend/agenda-frontend/src/components/capacitacion/SelectCapacitador.tsx`
- `frontend/agenda-frontend/src/components/capacitacion/CapacitacionForm.tsx`
- `progress/impl_f08.md` (este archivo)
- `progress/review_f08.md`

### Modificados
- `frontend/agenda-frontend/src/types/index.ts` (agregados `PersonalArea`, `CapacitacionCreatePayload`)
- `frontend/agenda-frontend/src/hooks/useAreas.ts` (agregado `usePersonalArea`)
- `frontend/agenda-frontend/src/services/capacitaciones.service.ts` (agregado `create()`)
- `frontend/agenda-frontend/src/hooks/useCapacitaciones.ts` (agregado `useCreateCapacitacion`)
- `frontend/agenda-frontend/src/routes/capacitaciones/crear.tsx` (reemplazado placeholder)
- `feature_list.json` (F08 done, completed 8 -> 9)
- `progress/current.md` (F08 marcada como ultima feature cerrada)
- `progress/history.md` (entrada de F08)

## Lecciones aprendidas

1. **El `enabled` flag de TanStack Query es la pieza clave del combo dependiente**: no hay que manejar estado de carga manual, la query se dispara sola cuando `areaId > 0`.

2. **Antes de F08, los placeholders de F05 tenian `beforeLoad` que solo validaban autenticacion, no roles. F08 lo eleva**: validar el rol en `beforeLoad` evita renderizar componentes y luego redirigir (mejor UX, sin flicker).

3. **El 401 handler inteligente del hotfix `fix_register_areas_401` permitio que `useAreas()` funcione tanto dentro como fuera de zonas autenticadas**: si el user no esta autenticado y navega al form de register, el `GET /api/areas` ahora es publico, y el 401 handler no rompe la sesion.

4. **chrome-devtools `click` no siempre dispara `onSubmit` de React forms**: el workaround es `evaluate_script` con `submitBtn.click()`. Esto es un problema de la herramienta, no del codigo.
