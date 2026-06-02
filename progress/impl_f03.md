# Implementacion: F03 - Backend CRUD Areas y Usuarios

**Fecha:** 2026-06-01
**Builder:** Codex
**Estado:** Completado

---

## Resumen

Se implementaron endpoints protegidos para areas y usuarios, incluyendo el endpoint critico `GET /api/areas/:id/personal`, middleware RBAC basado en permisos de base de datos y validaciones con Zod.

---

## Archivos Creados

- `backend/src/middleware/rbac.js`
- `backend/src/services/areas.service.js`
- `backend/src/services/usuarios.service.js`
- `backend/src/controllers/areasController.js`
- `backend/src/controllers/usuariosController.js`
- `backend/src/routes/areas.js`
- `backend/src/routes/usuarios.js`

## Archivos Modificados

- `backend/src/app.js`
- `feature_list.json`

---

## Endpoints Implementados

- `GET /api/areas`
- `GET /api/areas/:id`
- `GET /api/areas/:id/personal`
- `POST /api/areas`
- `PUT /api/areas/:id`
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `PUT /api/usuarios/:id`

---

## RBAC

Se agrego `requirePermission(permissionCode)` usando `usuarios_roles`, `roles`, `role_permisos` y `permisos`.

Permisos aplicados:

- `area:ver` para listar/ver areas.
- `usuario:ver` para listar/ver usuarios y personal por area.
- `area:crear` para crear areas.
- `area:editar` para editar areas.
- `usuario:editar` para editar usuarios.

---

## Verificacion Ejecutada

```text
loginJefe: 200
areasList: 200
areaShow: 200
personal: 200
usuariosList: 200
usuarioShow: 200
usuarioUpdate: 200
invalidUsuario: 400
rbacForbidden: 403
createAreaAdmin: 201
updateAreaAdmin: 200
invalidArea: 400
```

El test critico `GET /api/areas/1/personal` confirmo usuarios del area Desarrollo y presencia de rol `capacitador`.

---

## Notas

- Para probar `POST /api/areas` se creo un usuario admin temporal durante el smoke test y se le asigno el rol `admin` directamente en BD.
- F03 habilita el consumo futuro del combo dependiente de F08 mediante `GET /api/areas/:id/personal`.
