# Implementacion: F04 - Backend CRUD Capacitaciones y Registros

**Fecha:** 2026-06-01
**Builder:** Codex
**Estado:** Completado

---

## Resumen

Se implementaron endpoints de capacitaciones y registros con validaciones de negocio, filtros, control de cupo, control de duplicados, cancelacion y asistencia.

---

## Archivos Creados

- `backend/src/services/capacitaciones.service.js`
- `backend/src/controllers/capacitacionesController.js`
- `backend/src/controllers/registrosController.js`
- `backend/src/routes/capacitaciones.js`
- `backend/src/routes/registros.js`

## Archivos Modificados

- `backend/src/app.js`
- `backend/src/routes/areas.js`
- `backend/src/routes/usuarios.js`
- `feature_list.json`

---

## Endpoints Implementados

- `GET /api/capacitaciones`
- `GET /api/capacitaciones/:id`
- `GET /api/areas/:id/capacitaciones`
- `POST /api/capacitaciones`
- `PUT /api/capacitaciones/:id`
- `DELETE /api/capacitaciones/:id`
- `POST /api/capacitaciones/:id/registrar`
- `DELETE /api/capacitaciones/:id/registrar/:usuario_id`
- `PUT /api/capacitaciones/:id/registrar/:usuario_id/asistencia`
- `GET /api/usuarios/:id/capacitaciones`

---

## Validaciones de Negocio

- Nombre entre 5 y 255 caracteres.
- Fecha igual o posterior al dia actual.
- Duracion mayor a 0.
- Capacitador debe pertenecer al area seleccionada.
- Max participantes minimo 5.
- Registro duplicado devuelve 409.
- Registro sin cupo disponible devuelve 409.
- Registro en capacitacion cancelada devuelve 400.
- `DELETE /api/capacitaciones/:id` cancela la capacitacion (`estado = cancelada`).

---

## Verificacion Ejecutada

Smoke test principal:

```text
loginJefe: 200
registerUser: 201
createCap: 201
invalidCap: 400
listCaps: 200
showCap: 200
byArea: 200
updateCap: 200
registerCap: 201
duplicateReg: 409
asistencia: 200
byUsuario: 200
unregister: 200
cancelCap: 200
regCancelled: 400
```

Smoke test adicional:

```text
ownerUpdate: 200
capacity: sexto registro devuelve 409
```

---

## Notas

- Las rutas de registros se implementaron funcionalmente dentro de `routes/capacitaciones.js` porque dependen naturalmente de `:id` de capacitacion. Tambien se agrego `routes/registros.js` como artefacto compatible con el plan de F04.
- Se agregaron rutas derivadas en `areas.js` y `usuarios.js` para mantener los endpoints requeridos por CHECKPOINTS.
