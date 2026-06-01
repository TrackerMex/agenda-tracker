# Revision: F02 - Backend Autenticacion JWT + OAuth

**Fecha:** 2026-06-01
**Reviewer:** Codex
**Estado:** Aprobado

---

## Checkpoints

- [x] `POST /api/auth/register` funciona.
- [x] Registro valida email unico.
- [x] Registro hashea contrasenas con bcrypt.
- [x] Registro devuelve JWT valido.
- [x] `POST /api/auth/login` funciona.
- [x] Login valida credenciales.
- [x] Login devuelve JWT + refresh token.
- [x] `POST /api/auth/google` implementado.
- [x] `POST /api/auth/outlook` implementado.
- [x] `POST /api/auth/refresh` renueva tokens.
- [x] `backend/src/middleware/auth.js` verifica JWT correctamente.
- [x] Variables de entorno configuradas en `.env`.

---

## Evidencia

Smoke test ejecutado con `npx tsx` importando `src/app.js`:

```text
health       200 true
register     201 true true
duplicate    409
login        200 true true
me           200 true
refresh      200 true true
google       200 true
outlook      200 true
seedLogin    200 true
```

---

## Riesgos / Notas

- OAuth esta implementado como vinculacion/creacion por payload de perfil validado. La verificacion con Google/Microsoft usando tokens reales debe endurecerse cuando se aborde la integracion externa completa.
- Los secretos actuales en `.env` son solo de desarrollo.

---

## Veredicto

F02 aprobada. Se puede avanzar a F03: Backend - CRUD Areas y Usuarios.
