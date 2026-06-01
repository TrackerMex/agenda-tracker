# Revision: F03 - Backend CRUD Areas y Usuarios

**Fecha:** 2026-06-01
**Reviewer:** Codex
**Estado:** Aprobado

---

## Checkpoints

- [x] `GET /api/areas` devuelve lista de areas.
- [x] `GET /api/areas/:id` devuelve detalles de area especifica.
- [x] `GET /api/areas/:id/personal` devuelve usuarios del area con roles.
- [x] `POST /api/areas` crea area solo con permiso `area:crear`.
- [x] `PUT /api/areas/:id` actualiza area solo con permiso `area:editar`.
- [x] `GET /api/usuarios` lista usuarios con paginacion.
- [x] `GET /api/usuarios/:id` devuelve perfil de usuario.
- [x] `PUT /api/usuarios/:id` actualiza usuario.
- [x] Middleware RBAC valida permisos correctamente.
- [x] Validaciones ZOD rechazan datos invalidos.

---

## Evidencia

```text
loginJefe       200 true
areasList       200 true
areaShow        200 true
personal        200 true true
usuariosList    200 true true
usuarioShow     200 true
usuarioUpdate   200 true
invalidUsuario  400
rbacForbidden   403
createAreaAdmin 201 true
updateAreaAdmin 200 true
invalidArea     400
```

---

## Riesgos / Notas

- La prueba de admin usa asignacion directa del rol `admin` en BD porque el seed original no crea un usuario administrador explicito.
- `GET /api/areas/:id/personal` ya cumple la forma requerida para F08: usuarios del area con arreglo `roles`.

---

## Veredicto

F03 aprobada. Se puede avanzar a F04: Backend - CRUD Capacitaciones y Registros.
