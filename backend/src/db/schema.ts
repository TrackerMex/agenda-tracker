import { pgTable, serial, varchar, text, integer, boolean, timestamp, unique, date, time } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ══════════════════════════════════════════════════════════════════
// TABLA 1: AREAS
// ══════════════════════════════════════════════════════════════════
export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  descripcion: text('descripcion'),
  jefeId: integer('jefe_id').references(() => usuarios.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// TABLA 2: USUARIOS
// ══════════════════════════════════════════════════════════════════
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellido: varchar('apellido', { length: 100 }).notNull(),
  areaId: integer('area_id').references(() => areas.id).notNull(),
  googleId: varchar('google_id', { length: 255 }),
  outlookId: varchar('outlook_id', { length: 255 }),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// TABLA 3: CAPACITACIONES
// ══════════════════════════════════════════════════════════════════
export const capacitaciones = pgTable('capacitaciones', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  descripcion: text('descripcion'),
  areaId: integer('area_id').references(() => areas.id).notNull(),
  capacitadorId: integer('capacitador_id').references(() => usuarios.id).notNull(),
  fecha: date('fecha').notNull(),
  horaInicio: time('hora_inicio').notNull(),
  duracionMinutos: integer('duracion_minutos').notNull(),
  plataforma: varchar('plataforma', { length: 100 }).notNull(),
  maxParticipantes: integer('max_participantes').notNull(),
  googleCalendarEventId: varchar('google_calendar_event_id', { length: 255 }),
  outlookCalendarEventId: varchar('outlook_calendar_event_id', { length: 255 }),
  estado: varchar('estado', { length: 50 }).default('programada').notNull(), // programada, completada, cancelada
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// TABLA 4: REGISTROS_CAPACITACION (M2M)
// ══════════════════════════════════════════════════════════════════
export const registrosCapacitacion = pgTable('registros_capacitacion', {
  id: serial('id').primaryKey(),
  capacitacionId: integer('capacitacion_id').references(() => capacitaciones.id).notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id).notNull(),
  registradoEn: timestamp('registrado_en').defaultNow().notNull(),
  asistio: boolean('asistio').default(false),
  comentarios: text('comentarios'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueRegistro: unique('unique_capacitacion_usuario').on(table.capacitacionId, table.usuarioId),
}));

// ══════════════════════════════════════════════════════════════════
// TABLA 5: ROLES
// ══════════════════════════════════════════════════════════════════
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull().unique(),
  descripcion: text('descripcion'),
  nivelJerarquia: integer('nivel_jerarquia').notNull(), // 0=usuario, 10=capacitador, 20=jefe, 30=admin
  esActivo: boolean('es_activo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// TABLA 6: PERMISOS
// ══════════════════════════════════════════════════════════════════
export const permisos = pgTable('permisos', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 100 }).notNull().unique(), // ej: "capacitacion:crear"
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  modulo: varchar('modulo', { length: 50 }).notNull(), // capacitaciones, usuarios, areas, etc.
  accion: varchar('accion', { length: 50 }).notNull(), // crear, editar, eliminar, ver
  esActivo: boolean('es_activo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// TABLA 7: ROLE_PERMISOS (M2M)
// ══════════════════════════════════════════════════════════════════
export const rolePermisos = pgTable('role_permisos', {
  id: serial('id').primaryKey(),
  rolId: integer('rol_id').references(() => roles.id).notNull(),
  permisoId: integer('permiso_id').references(() => permisos.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueRolPermiso: unique('unique_rol_permiso').on(table.rolId, table.permisoId),
}));

// ══════════════════════════════════════════════════════════════════
// TABLA 8: USUARIOS_ROLES (M2M)
// ══════════════════════════════════════════════════════════════════
export const usuariosRoles = pgTable('usuarios_roles', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').references(() => usuarios.id).notNull(),
  rolId: integer('rol_id').references(() => roles.id).notNull(),
  asignadoPorUsuarioId: integer('asignado_por_usuario_id').references(() => usuarios.id),
  asignadoEn: timestamp('asignado_en').defaultNow().notNull(),
  esActivo: boolean('es_activo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUsuarioRol: unique('unique_usuario_rol').on(table.usuarioId, table.rolId),
}));

// ══════════════════════════════════════════════════════════════════
// TABLA 9: AUDITORIA_ROLES
// ══════════════════════════════════════════════════════════════════
export const auditoriaRoles = pgTable('auditoria_roles', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').references(() => usuarios.id).notNull(),
  accion: varchar('accion', { length: 50 }).notNull(), // rol_asignado, rol_removido
  rolId: integer('rol_id').references(() => roles.id).notNull(),
  realizadoPorUsuarioId: integer('realizado_por_usuario_id').references(() => usuarios.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// RELACIONES
// ══════════════════════════════════════════════════════════════════

export const areasRelations = relations(areas, ({ one, many }) => ({
  jefe: one(usuarios, {
    fields: [areas.jefeId],
    references: [usuarios.id],
  }),
  usuarios: many(usuarios),
  capacitaciones: many(capacitaciones),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  area: one(areas, {
    fields: [usuarios.areaId],
    references: [areas.id],
  }),
  capacitacionesDictadas: many(capacitaciones),
  registros: many(registrosCapacitacion),
  usuariosRoles: many(usuariosRoles),
}));

export const capacitacionesRelations = relations(capacitaciones, ({ one, many }) => ({
  area: one(areas, {
    fields: [capacitaciones.areaId],
    references: [areas.id],
  }),
  capacitador: one(usuarios, {
    fields: [capacitaciones.capacitadorId],
    references: [usuarios.id],
  }),
  registros: many(registrosCapacitacion),
}));

export const registrosCapacitacionRelations = relations(registrosCapacitacion, ({ one }) => ({
  capacitacion: one(capacitaciones, {
    fields: [registrosCapacitacion.capacitacionId],
    references: [capacitaciones.id],
  }),
  usuario: one(usuarios, {
    fields: [registrosCapacitacion.usuarioId],
    references: [usuarios.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermisos: many(rolePermisos),
  usuariosRoles: many(usuariosRoles),
}));

export const permisosRelations = relations(permisos, ({ many }) => ({
  rolePermisos: many(rolePermisos),
}));

export const rolePermisosRelations = relations(rolePermisos, ({ one }) => ({
  rol: one(roles, {
    fields: [rolePermisos.rolId],
    references: [roles.id],
  }),
  permiso: one(permisos, {
    fields: [rolePermisos.permisoId],
    references: [permisos.id],
  }),
}));

export const usuariosRolesRelations = relations(usuariosRoles, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [usuariosRoles.usuarioId],
    references: [usuarios.id],
  }),
  rol: one(roles, {
    fields: [usuariosRoles.rolId],
    references: [roles.id],
  }),
}));

// ══════════════════════════════════════════════════════════════════
// TYPES (para usar en el código)
// ══════════════════════════════════════════════════════════════════

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export type Capacitacion = typeof capacitaciones.$inferSelect;
export type NewCapacitacion = typeof capacitaciones.$inferInsert;

export type RegistroCapacitacion = typeof registrosCapacitacion.$inferSelect;
export type NewRegistroCapacitacion = typeof registrosCapacitacion.$inferInsert;

export type Rol = typeof roles.$inferSelect;
export type NewRol = typeof roles.$inferInsert;

export type Permiso = typeof permisos.$inferSelect;
export type NewPermiso = typeof permisos.$inferInsert;

export type RolPermiso = typeof rolePermisos.$inferSelect;
export type NewRolPermiso = typeof rolePermisos.$inferInsert;

export type UsuarioRol = typeof usuariosRoles.$inferSelect;
export type NewUsuarioRol = typeof usuariosRoles.$inferInsert;

export type AuditoriaRol = typeof auditoriaRoles.$inferSelect;
export type NewAuditoriaRol = typeof auditoriaRoles.$inferInsert;
