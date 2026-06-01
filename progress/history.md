# Historial del Proyecto

## [2026-05-20] Inicio del Proyecto

**Feature:** F00 - Setup Inicial y Arquitectura Harness
**Status:** En progreso
**Builder:** Claude Sonnet

### Acciones Realizadas

1. **Creación de Arquitectura Harness Subagentes:**
   - Archivo AGENTS.md con mapa completo de fases
   - Definiciones de 3 roles: orchestrator, builder, reviewer
   - Sistema de estado persistente en progress/

2. **Definición de Features:**
   - feature_list.json con 14 features del proyecto
   - Dependencias entre features claramente definidas
   - Metadata de estimaciones y prioridades

3. **Criterios de Validación:**
   - CHECKPOINTS.md con criterios para cada feature
   - Ejemplos de validación y comandos de verificación
   - Formato estándar de revisión

4. **Documentación Técnica:**
   - docs/ARCHITECTURE.md - Arquitectura completa del sistema
   - docs/CONVENTIONS.md - Convenciones de código
   - docs/VERIFICATION.md - Guía de verificación

5. **Definición de Agentes:**
   - .claude/agents/orchestrator.md - Rol de coordinación
   - .claude/agents/builder.md - Rol de implementación
   - .claude/agents/reviewer.md - Rol de validación

### Decisiones Arquitectónicas

1. **Patrón Harness Engineering:** Adoptado del repositorio ejemplo-harness-subagentes
2. **Estado en Disco:** Todo el estado vive en archivos versionados
3. **Validación Estricta:** 100% de checkpoints deben pasar
4. **Documentación Sincronizada:** Código y documentación evolucionan juntos

### Próximos Pasos

- Completar archivos de configuración (README.md, .env.example)
- Ejecutar init.sh para verificar estructura
- Marcar F00 como done
- Comenzar F01: Base de Datos

---

## [2026-05-20] Feature F01 - Implementación Completada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** Implementado, pendiente de revisión
**Builder:** Claude Sonnet 4.5
**Duración:** 2 horas

### Resumen

Se implementó el schema completo de la base de datos con Drizzle ORM:

**Archivos creados:**
- `backend/drizzle.config.ts` - Configuración Drizzle
- `backend/src/db/schema.ts` - 9 tablas + relaciones + types
- `backend/src/db/index.ts` - Conexión PostgreSQL
- `backend/src/db/seed.ts` - Datos de semilla
- `backend/src/db/migrations/0000_medical_gamora.sql` - Migración inicial
- `backend/.env` - Variables de entorno
- `progress/impl_f01.md` - Documentación completa

**Tablas implementadas (9):**
1. areas (4 áreas)
2. usuarios (14 usuarios seed)
3. capacitaciones (3 capacitaciones seed)
4. registros_capacitacion (M2M)
5. roles (4 roles)
6. permisos (15 permisos)
7. role_permisos (M2M)
8. usuarios_roles (M2M)
9. auditoria_roles

**Dependencias instaladas:**
- drizzle-orm v0.45.2
- postgres v3.4.9
- drizzle-kit v0.31.10 (dev)
- tsx v4.22.3 (dev)

**Scripts agregados:**
- `npm run db:generate` - Generar migraciones
- `npm run db:migrate` - Aplicar migraciones
- `npm run db:push` - Push directo a BD
- `npm run db:studio` - Drizzle Studio UI
- `npm run db:seed` - Ejecutar seed

### Decisiones Arquitectónicas

1. **Drizzle ORM:** Elegido por type-safety, performance y migraciones automáticas
2. **ES Modules:** Cambiado `package.json` a `"type": "module"`
3. **Sistema RBAC:** 4 tablas para control granular de permisos
4. **Relaciones explícitas:** Todas definidas con `relations()` para queries relacionales

### Puntos Críticos Implementados

✅ `area_id` en usuarios (crucial para F03 y F08)
✅ UNIQUE constraint en registros_capacitacion
✅ Campos OAuth (google_id, outlook_id) para F09
✅ Campos event_ids en capacitaciones para F09
✅ Sistema RBAC completo

### Datos de Seed

- 4 áreas (Desarrollo, Operaciones, QA, Product Manager)
- 14 usuarios distribuidos en áreas
- 4 roles con jerarquía (usuario, capacitador, jefe_area, admin)
- 15 permisos granulares
- 3 capacitaciones de ejemplo
- Jefes asignados a cada área

### Pendiente

⏳ Usuario debe ejecutar migraciones y seed
⏳ Reviewer debe validar contra CHECKPOINTS.md
⏳ Aprobar feature para continuar con F02

### Notas Importantes

⚠️ Contraseñas en seed están en texto plano (`password123`)
→ Se hashearán con bcrypt en F02

⚠️ `.env` creado con credenciales por defecto
→ Usuario debe ajustar según su configuración PostgreSQL

---

## Template para Futuras Entradas

```markdown
## [YYYY-MM-DD] Feature FXX Completada

**Feature:** FXX - Nombre
**Duración:** X semanas
**Builder:** Nombre
**Reviewer:** Nombre

**Resumen:**
- Descripción breve de lo implementado

**Archivos creados:**
- archivo1.js
- archivo2.tsx

**Lecciones aprendidas:**
- Lección 1
- Lección 2

**Problemas encontrados:**
- Problema 1 y cómo se resolvió
```

---

**Última actualización:** 2026-05-20

---

## [2026-06-01] Feature F01 - Revision Retomada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** Implementacion corregida, pendiente por credenciales de PostgreSQL
**Reviewer:** Codex

### Acciones Realizadas

1. Se reviso `CHECKPOINTS.md` para F01.
2. Se verifico que `backend/src/db/schema.ts` define las 9 tablas requeridas.
3. Se verifico la migracion inicial `backend/src/db/migrations/0000_medical_gamora.sql`.
4. Se ejecuto `npm run db:generate` con resultado exitoso.
5. Se corrigio `backend/src/db/seed.ts` para usar `eq(...)` en las actualizaciones de jefes de area.
6. Se creo `progress/review_f01.md`.

### Bloqueador

`npm run db:migrate` y `npm run db:seed` no pudieron completarse porque `backend/.env` usa:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/capacitaciones
```

PostgreSQL local esta corriendo, pero rechaza esa clave para el usuario `postgres`.

### Proximo Paso

Actualizar `backend/.env` con una `DATABASE_URL` valida y repetir:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## [2026-06-01] Feature F01 - Aprobada

**Feature:** F01 - Base de Datos Schema y Migraciones
**Status:** done
**Reviewer:** Codex

### Acciones Realizadas

1. Se ejecuto `npm run db:migrate` correctamente.
2. Se ajusto `backend/src/db/seed.ts` para hacerlo idempotente.
3. Se ejecuto `npm run db:seed` correctamente.
4. Se validaron conteos SQL contra PostgreSQL local.
5. Se actualizo `progress/review_f01.md` con veredicto aprobado.
6. Se marco F01 como `done` en `feature_list.json`.

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

### Proximo Paso

Iniciar F02: Backend - Autenticacion JWT + OAuth.
