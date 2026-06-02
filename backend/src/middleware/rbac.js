import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { permisos, rolePermisos, roles, usuariosRoles } from '../db/schema.ts';

async function userHasPermission(userId, permissionCode) {
  const rows = await db
    .select({ permisoId: permisos.id })
    .from(usuariosRoles)
    .innerJoin(roles, eq(usuariosRoles.rolId, roles.id))
    .innerJoin(rolePermisos, eq(rolePermisos.rolId, roles.id))
    .innerJoin(permisos, eq(rolePermisos.permisoId, permisos.id))
    .where(
      and(
        eq(usuariosRoles.usuarioId, userId),
        eq(usuariosRoles.esActivo, true),
        eq(roles.esActivo, true),
        eq(permisos.esActivo, true),
        eq(permisos.codigo, permissionCode)
      )
    );

  return rows.length > 0;
}

export function requirePermission(permissionCode) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticacion requerida',
      });
    }

    const allowed = await userHasPermission(req.user.id, permissionCode);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
      });
    }

    return next();
  };
}

export function requireAnyPermission(permissionCodes) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticacion requerida',
      });
    }

    const rows = await db
      .select({ permisoCodigo: permisos.codigo })
      .from(usuariosRoles)
      .innerJoin(roles, eq(usuariosRoles.rolId, roles.id))
      .innerJoin(rolePermisos, eq(rolePermisos.rolId, roles.id))
      .innerJoin(permisos, eq(rolePermisos.permisoId, permisos.id))
      .where(
        and(
          eq(usuariosRoles.usuarioId, req.user.id),
          eq(usuariosRoles.esActivo, true),
          eq(roles.esActivo, true),
          eq(permisos.esActivo, true),
          inArray(permisos.codigo, permissionCodes)
        )
      );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
      });
    }

    return next();
  };
}
