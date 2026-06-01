# Implementacion: F02 - Backend Autenticacion JWT + OAuth

**Fecha:** 2026-06-01
**Builder:** Codex
**Estado:** Completado

---

## Resumen

Se implemento la base de autenticacion del backend con Express, JWT, refresh tokens, bcrypt, validaciones con Zod y endpoints OAuth para Google y Outlook mediante payload de perfil validado.

---

## Archivos Creados

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/routes/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/middleware/auth.js`
- `backend/src/services/auth.service.js`

## Archivos Modificados

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env`
- `feature_list.json`

---

## Endpoints Implementados

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/outlook`
- `POST /api/auth/refresh`
- `GET /api/auth/me` para validar middleware JWT
- `GET /health` para healthcheck del backend

---

## Decisiones Tecnicas

1. Se agrego `tsx` al script `start` para permitir que los archivos `.js` del backend importen el schema Drizzle en TypeScript durante esta etapa temprana.
2. `register` asigna automaticamente el rol `usuario`.
3. `login` soporta migracion suave de passwords seed en texto plano: si el password coincide, lo hashea y actualiza en BD.
4. Los endpoints Google/Outlook aceptan payload de perfil validado (`provider_id`, `email`, `nombre`, `apellido`, `area_id`) y crean o vinculan usuarios. La validacion real contra proveedores externos queda para fases de integracion.
5. `GET /api/auth/me` usa `middleware/auth.js` para comprobar tokens en pruebas y habilitar F03.

---

## Dependencias Instaladas

- `bcryptjs`
- `jsonwebtoken`
- `zod`
- `cors`

---

## Verificacion Ejecutada

Smoke test con servidor Express en puerto dinamico:

```text
health: 200
register: 201, token ok, refreshToken ok
duplicate register: 409
login: 200, token ok, refreshToken ok
me: 200, usuario autenticado ok
refresh: 200, token ok, refreshToken ok
google: 200, token ok
outlook: 200, token ok
seedLogin: 200, token ok
```

---

## Notas

- `backend/.env` contiene secretos JWT de desarrollo; deben reemplazarse antes de produccion.
- `npm install` reporto 4 vulnerabilidades moderadas existentes en el arbol de dependencias. No se ejecuto `npm audit fix --force` porque podria introducir cambios mayores no relacionados.
