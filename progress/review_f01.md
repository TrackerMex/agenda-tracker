# Revision: F01 - Base de Datos Schema y Migraciones

**Fecha:** 2026-06-01
**Reviewer:** Codex
**Estado:** Aprobado

---

## Resumen

Se reviso F01 contra `CHECKPOINTS.md`. La implementacion contiene el schema Drizzle, migracion inicial y seed requeridos. Se corrigio un error en `backend/src/db/seed.ts`: las actualizaciones de jefes de area usaban `.where({ nombre: ... })`, que no es valido en Drizzle; ahora usan `eq(areas.nombre, ...)`.

La validacion completa fue ejecutada correctamente el 2026-06-01 despues de actualizar la `DATABASE_URL` local.

---

## Checkpoints

- [x] `backend/drizzle.config.ts` existe y apunta a `src/db/schema.ts` y `src/db/migrations`.
- [x] `backend/src/db/schema.ts` define las 9 tablas requeridas:
  - `areas`
  - `usuarios`
  - `capacitaciones`
  - `registros_capacitacion`
  - `roles`
  - `permisos`
  - `role_permisos`
  - `usuarios_roles`
  - `auditoria_roles`
- [x] Foreign keys definidas en schema y migracion.
- [x] `npm run db:generate` ejecuta sin errores.
- [x] Seed contiene 4 areas, 14 usuarios, 4 roles y permisos asignados.
- [x] `npm run db:migrate` ejecuta sin errores contra PostgreSQL local.
- [x] `npm run db:seed` ejecuta sin errores contra PostgreSQL local.
- [x] Validaciones SQL ejecutadas contra datos reales.

---

## Comandos Ejecutados

### `npm run db:generate`

Resultado: exitoso.

Drizzle detecto 9 tablas:

- `areas`
- `auditoria_roles`
- `capacitaciones`
- `permisos`
- `registros_capacitacion`
- `role_permisos`
- `roles`
- `usuarios`
- `usuarios_roles`

Salida clave: `No schema changes, nothing to migrate`.

### `npm run db:migrate`

Resultado: exitoso.

Salida clave:

```text
migrations applied successfully
```

### `npm run db:seed`

Resultado: exitoso.

Salida clave:

```text
Seed completado exitosamente
```

El seed fue ajustado para ser idempotente; puede ejecutarse sobre una base ya sembrada sin fallar por duplicados.

### Validaciones SQL

```text
areas: 4
usuarios: 14
roles: 4
permisos: 15
role_permisos: 32
usuarios_roles: 14
capacitaciones: 3
```

Personal del area Desarrollo validado:

```text
juan.perez@empresa.com
maria.garcia@empresa.com
carlos.lopez@empresa.com
ana.martinez@empresa.com
```

---

## Cambios Realizados Durante la Revision

Archivo: `backend/src/db/seed.ts`

- Se agrego `import { eq } from 'drizzle-orm';`
- Se cambiaron las 4 llamadas de asignacion de jefes de area para usar:

```ts
where(eq(areas.nombre, 'Desarrollo'))
```

Esto evita que el seed falle al llegar a la fase de actualizacion de areas.

---

## Veredicto

F01 aprobada. Se puede avanzar a F02: Backend - Autenticacion JWT + OAuth.
