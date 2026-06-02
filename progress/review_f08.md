# F08 - Review

**Estado:** approved
**Fecha de revision:** 2026-06-02
**Revisor:** reviewer
**Feature:** F08 - Frontend - Formulario Crear Capacitacion (Combo Dependiente)

---

## Validacion contra CHECKPOINTS

### C1. La feature compila sin errores
- **Estado:** PASS
- **Evidencia:** `npm run typecheck` retorna 0 errores, sin warnings de TS.

### C2. La feature sigue los patrones del proyecto
- **Estado:** PASS
- **Evidencia:**
  - Componentes UI usan shadcn-style de `components/ui/*` (Card, Input, Label, Button, Alert)
  - Service / Hook pattern: `services/*.service.ts` + `hooks/use*.ts` igual que F06/F07
  - Validacion: `useState` + zod schema inline (mismo patron que register/login)
  - TanStack Query con query keys, staleTime, enabled, invalidacion en onSuccess
  - Antes de F08, las queries ya estaban en `hooks/useAreas.ts` y `hooks/useCapacitaciones.ts` — F08 los extiende sin crear archivos duplicados
  - Naming: `usePersonalArea` (sigue `useAreas`), `useCreateCapacitacion` (sigue `useRegistrarmeACapacitacion`)
  - Iconos: `lucide-react` (mismo set que el resto)
  - Path alias `@/*` consistente

### C3. El combo dependiente funciona correctamente
- **Estado:** PASS (feature CRITICA del proyecto)
- **Evidencia:**
  - Al seleccionar area, se dispara `GET /api/areas/:id/personal` (verificado en network panel)
  - El dropdown de capacitadores se llena solo con usuarios de esa area
  - Filtrado adicional por rol: solo `capacitador`/`jefe_area`/`admin`
  - Al cambiar de area, el capacitador seleccionado se limpia (no se envia un capacitador que ya no pertenece)
  - Cuando `areaId` es null, el select esta disabled con mensaje "Selecciona un area primero"
  - Cuando `isLoading`, esta disabled con "Cargando personal..."
  - Cuando no hay capacitadores en el area, muestra hint "Esta area no tiene usuarios con rol capacitador, jefe o admin..."
  - Email del capacitador se muestra en verde como feedback visual

### C4. El endpoint `GET /api/areas/:id/personal` se consume
- **Estado:** PASS
- **Evidencia:**
  - El hook `usePersonalArea(areaId)` llama `areasService.getPersonal(areaId)` que hace `GET /api/areas/:id/personal`
  - El endpoint requiere auth (`auth` middleware) y permiso `usuario:ver` (puesto en F03)
  - El test verifico que con sesion iniciada de juan.perez (jefe_area), la peticion retorna 200 con 26 personas

### C5. Validacion del frontend coherente con backend
- **Estado:** PASS
- **Evidencia:**
  - Frontend: zod valida `nombre` (5-255), `area_id` (positive int), `capacitador_id` (positive int), `fecha` (regex + >= today), `hora_inicio` (regex HH:MM), `duracion_minutos` (positive, max 600), `plataforma` (2-100), `max_participantes` (5-500)
  - Backend: `capacitacionesController.js:25-35` valida con zod los mismos constraints exactos
  - Hay un solo caso donde el backend es mas estricto: `hora_inicio` acepta `:SS` opcional, frontend usa HH:MM estricto. Esto es OK porque el navegador envia HH:MM.
  - El backend rechaza fechas pasadas con mensaje claro: "La fecha debe ser hoy o posterior" — el frontend tambien lo valida con `min` en el input date
  - El backend valida que el capacitador pertenezca al area (`validateCapacitadorArea`) — esto esta garantizado por el filtro del select, pero el backend lo verifica de nuevo como safety net

### C6. RBAC: solo jefe_area y admin pueden crear
- **Estado:** PASS
- **Evidencia:**
  - `routes/capacitaciones/crear.tsx:beforeLoad` verifica `user.roles.includes('jefe_area') || user.roles.includes('admin')`, sino redirige a `/dashboard`
  - El sidebar ya escondia el link para no-jefes (feature pre-existente de F05/F07)
  - Test con `browser.test@empresa.com` (rol: usuario): intento de GET `/capacitaciones/crear` -> redirect a `/dashboard`
  - El backend tambien valida via `requirePermission('capacitacion:crear')` (puesto en F04)

### C7. UI/UX consistente con el resto del proyecto
- **Estado:** PASS
- **Evidencia:**
  - Mismos componentes shadcn-style usados en register/login
  - Iconos semanticos (Calendar, Clock, Users, Hash, FileText, Link2, Building2, GraduationCap)
  - Asterisco rojo (*) en campos obligatorios
  - Mensajes de error en color destructive
  - `aria-invalid`, `aria-describedby`, `aria-live` para accesibilidad
  - Action bar al final con boton secundario (Cancelar) y primario (Crear capacitacion) con spinner
  - Success card con patron consistente con otros componentes Card
  - Responsive: grid 2 columnas en md+, 1 columna en mobile

### C8. Documentacion sincronizada
- **Estado:** PASS
- **Evidencia:**
  - `progress/impl_f08.md` creado con resumen, decisiones, artefactos, verificacion
  - `progress/review_f08.md` (este archivo)
  - `feature_list.json` actualizado: F08 status `done`, completed 8 -> 9, pending 6 -> 5
  - `progress/current.md` actualizado: F08 como ultima feature cerrada
  - `progress/history.md` actualizado con entrada de F08

## Smoke test (browser via chrome-devtools)

| # | Test | Resultado |
|---|------|-----------|
| 1 | Login como juan.perez (jefe_area) | OK - dashboard con "Hola, Juan" |
| 2 | Sidebar muestra "Crear Capacitacion" | OK - 4 items en sidebar |
| 3 | Navegacion a /capacitaciones/crear | OK - form renderizado |
| 4 | Pre-relleno del area del usuario (Desarrollo) | OK - `area_id = 1` por default |
| 5 | Dropdown de areas con 5 opciones | OK |
| 6 | Dropdown de capacitadores filtrado por Desarrollo | OK - 6 personas (juan, maria, 4x F03 Admin) |
| 7 | Cambio de area QA limpia el capacitador | OK - capacitador resetea a placeholder, fetchea nuevo personal |
| 8 | Cambio a QA carga 2 capacitadores (Laura, Pedro) | OK |
| 9 | Submit con form vacio -> errores inline | OK - 4 errores visibles con aria-invalid |
| 10 | Submit con datos validos -> crea en backend | OK - POST 201, capacitacion id=6 |
| 11 | Success card con info correcta | OK - titulo, fecha, hora, 3 botones |
| 12 | "Ver detalle" navega a /capacitaciones/6 | OK - pagina de F07 muestra datos correctos |
| 13 | Capacitacion visible en backend con todos los campos | OK - GET /api/capacitaciones/6 retorna objeto completo |
| 14 | Logout + login como browser.test (no-jefe) | OK - sidebar solo 2 items |
| 15 | Acceso a /capacitaciones/crear como no-jefe | OK - redirect a /dashboard |

**Resultado:** 15/15 tests pasados.

## Observaciones menores (no bloqueantes)

1. **4 entradas duplicadas de "F03 Admin" en el dropdown**: la data de seed tiene 4 usuarios con el mismo nombre en el area 1. Esto se resolveria en un seed cleanup, no es un bug del codigo.

2. **El `<textarea>` para descripcion es nativo, no un componente shadcn**: se sigue el estilo del `Input` pero no es reutilizable. Se podria extraer a `components/ui/textarea.tsx` en una iteracion futura.

3. **El boton "Cancelar" usa `navigate({ to: '/capacitaciones' })` que es client-side**: si la mutacion ya esta en curso (`isSubmitting`), se mantiene disabled. Bien.

4. **Mensaje del placeholder "Crear otra" no es visible cuando se muestra el success card**: podria ser util un toast confirmando "Capacitacion creada", pero el success card con la info es suficientemente claro.

5. **`usePersonalArea` no expone `data` cuando `areaId` es null**: el componente SelectCapacitador maneja esto con un early return (`capacitadores = []`). No hay riesgo de crash.

## Conclusion

**F08 aprobada.** La feature mas critica del proyecto segun AGENTS.md esta implementada y verificada end-to-end:
- Combo dependiente funciona correctamente (cambio de area limpia y recarga capacitadores)
- Validacion frontend y backend coherentes
- RBAC correcto (jefe_area o admin pueden acceder, demas redirigen)
- UI consistente con el resto del proyecto
- Documentacion completa

Sin issues bloqueantes. Las observaciones menores quedan registradas para iteraciones futuras.

**Siguiente feature sugerida:** F09 - Backend - Integraciones Externas (Google Calendar, Microsoft Graph, Email) o F10 - Frontend - Dashboard Jefe de Area (que ahora tiene sentido hacer porque el form de crear esta listo).
