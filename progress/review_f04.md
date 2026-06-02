# Revision: F04 - Backend CRUD Capacitaciones y Registros

**Fecha:** 2026-06-01
**Reviewer:** Codex
**Estado:** Aprobado

---

## Checkpoints

- [x] `GET /api/capacitaciones` devuelve lista con filtros por area, estado y fecha.
- [x] `GET /api/capacitaciones/:id` devuelve detalles completos.
- [x] `GET /api/areas/:id/capacitaciones` filtra por area.
- [x] `POST /api/capacitaciones` crea capacitacion con validaciones.
- [x] `PUT /api/capacitaciones/:id` actualiza con control de propietario/rol.
- [x] `DELETE /api/capacitaciones/:id` cancela capacitacion.
- [x] `POST /api/capacitaciones/:id/registrar` registra usuario.
- [x] Registro duplicado devuelve 409.
- [x] Cupo lleno devuelve 409.
- [x] Capacitacion cancelada rechaza registros.
- [x] `DELETE /api/capacitaciones/:id/registrar/:usuario_id` desregistra.
- [x] `PUT /api/capacitaciones/:id/registrar/:usuario_id/asistencia` marca asistencia.
- [x] `GET /api/usuarios/:id/capacitaciones` lista capacitaciones del usuario.

---

## Evidencia

```text
loginJefe       200 true
registerUser    201 true
createCap       201 true
invalidCap      400
listCaps        200 true
showCap         200 true true
byArea          200 true
updateCap       200 true
registerCap     201 true
duplicateReg    409
asistencia      200 true
byUsuario       200 true
unregister      200 true
cancelCap       200 true
regCancelled    400
ownerUpdate     200 true
capacity        201 true
```

---

## Riesgos / Notas

- La implementacion no elimina capacitaciones fisicamente; `DELETE` cambia `estado` a `cancelada`, alineado con la regla de negocio del checkpoint.
- La verificacion de capacitador permite que el capacitador duenio edite su capacitacion aunque el seed no le asigne `capacitacion:editar`; la ruta permite pasar por `capacitacion:marcar_asistencia` y el servicio valida propiedad.

---

## Veredicto

F04 aprobada. Se puede avanzar a F05: Frontend - Setup, Router y Layout.
