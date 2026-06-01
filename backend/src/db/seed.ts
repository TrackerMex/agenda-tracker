import { db, closeConnection } from './index.js';
import { eq, inArray } from 'drizzle-orm';
import {
  areas,
  usuarios,
  capacitaciones,
  roles,
  permisos,
  rolePermisos,
  usuariosRoles,
  type NewArea,
  type NewUsuario,
  type NewCapacitacion,
  type NewRol,
  type NewPermiso,
  type NewRolPermiso,
  type NewUsuarioRol,
} from './schema.js';

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  try {
    // ══════════════════════════════════════════════════════════════
    // 1. CREAR ÁREAS (4 áreas)
    // ══════════════════════════════════════════════════════════════
    console.log('📁 Creando áreas...');
    const areasData: NewArea[] = [
      { nombre: 'Desarrollo', descripcion: 'Equipo de desarrollo de software' },
      { nombre: 'Operaciones', descripcion: 'Equipo de operaciones e infraestructura' },
      { nombre: 'QA', descripcion: 'Equipo de aseguramiento de calidad' },
      { nombre: 'Product Manager', descripcion: 'Equipo de gestión de producto' },
    ];

    await db.insert(areas).values(areasData).onConflictDoNothing();
    const insertedAreas = await db
      .select()
      .from(areas)
      .where(inArray(areas.nombre, areasData.map((area) => area.nombre)));
    insertedAreas.sort(
      (a, b) => areasData.findIndex((area) => area.nombre === a.nombre) - areasData.findIndex((area) => area.nombre === b.nombre)
    );
    console.log(`✅ ${insertedAreas.length} áreas creadas\n`);

    // ══════════════════════════════════════════════════════════════
    // 2. CREAR ROLES (4 roles)
    // ══════════════════════════════════════════════════════════════
    console.log('👥 Creando roles...');
    const rolesData: NewRol[] = [
      {
        nombre: 'usuario',
        descripcion: 'Usuario regular del sistema',
        nivelJerarquia: 0,
      },
      {
        nombre: 'capacitador',
        descripcion: 'Puede dictar capacitaciones',
        nivelJerarquia: 10,
      },
      {
        nombre: 'jefe_area',
        descripcion: 'Jefe de área, puede gestionar capacitaciones de su área',
        nivelJerarquia: 20,
      },
      {
        nombre: 'admin',
        descripcion: 'Administrador del sistema',
        nivelJerarquia: 30,
      },
    ];

    await db.insert(roles).values(rolesData).onConflictDoNothing();
    const insertedRoles = await db
      .select()
      .from(roles)
      .where(inArray(roles.nombre, rolesData.map((rol) => rol.nombre)));
    console.log(`✅ ${insertedRoles.length} roles creados\n`);

    // ══════════════════════════════════════════════════════════════
    // 3. CREAR PERMISOS
    // ══════════════════════════════════════════════════════════════
    console.log('🔐 Creando permisos...');
    const permisosData: NewPermiso[] = [
      // Permisos de capacitaciones
      { codigo: 'capacitacion:ver', nombre: 'Ver capacitaciones', modulo: 'capacitaciones', accion: 'ver' },
      { codigo: 'capacitacion:crear', nombre: 'Crear capacitaciones', modulo: 'capacitaciones', accion: 'crear' },
      { codigo: 'capacitacion:editar', nombre: 'Editar capacitaciones', modulo: 'capacitaciones', accion: 'editar' },
      { codigo: 'capacitacion:eliminar', nombre: 'Eliminar capacitaciones', modulo: 'capacitaciones', accion: 'eliminar' },
      { codigo: 'capacitacion:registrarse', nombre: 'Registrarse a capacitaciones', modulo: 'capacitaciones', accion: 'registrarse' },
      { codigo: 'capacitacion:marcar_asistencia', nombre: 'Marcar asistencia', modulo: 'capacitaciones', accion: 'marcar_asistencia' },

      // Permisos de usuarios
      { codigo: 'usuario:ver', nombre: 'Ver usuarios', modulo: 'usuarios', accion: 'ver' },
      { codigo: 'usuario:crear', nombre: 'Crear usuarios', modulo: 'usuarios', accion: 'crear' },
      { codigo: 'usuario:editar', nombre: 'Editar usuarios', modulo: 'usuarios', accion: 'editar' },
      { codigo: 'usuario:eliminar', nombre: 'Eliminar usuarios', modulo: 'usuarios', accion: 'eliminar' },

      // Permisos de áreas
      { codigo: 'area:ver', nombre: 'Ver áreas', modulo: 'areas', accion: 'ver' },
      { codigo: 'area:crear', nombre: 'Crear áreas', modulo: 'areas', accion: 'crear' },
      { codigo: 'area:editar', nombre: 'Editar áreas', modulo: 'areas', accion: 'editar' },

      // Permisos de roles
      { codigo: 'rol:ver', nombre: 'Ver roles', modulo: 'roles', accion: 'ver' },
      { codigo: 'rol:asignar', nombre: 'Asignar roles', modulo: 'roles', accion: 'asignar' },
    ];

    await db.insert(permisos).values(permisosData).onConflictDoNothing();
    const insertedPermisos = await db
      .select()
      .from(permisos)
      .where(inArray(permisos.codigo, permisosData.map((permiso) => permiso.codigo)));
    console.log(`✅ ${insertedPermisos.length} permisos creados\n`);

    // ══════════════════════════════════════════════════════════════
    // 4. ASIGNAR PERMISOS A ROLES
    // ══════════════════════════════════════════════════════════════
    console.log('🔗 Asignando permisos a roles...');

    // Encontrar IDs de roles
    const rolUsuario = insertedRoles.find(r => r.nombre === 'usuario')!;
    const rolCapacitador = insertedRoles.find(r => r.nombre === 'capacitador')!;
    const rolJefe = insertedRoles.find(r => r.nombre === 'jefe_area')!;
    const rolAdmin = insertedRoles.find(r => r.nombre === 'admin')!;

    // Helper para encontrar permisos por código
    const getPermisoId = (codigo: string) => insertedPermisos.find(p => p.codigo === codigo)!.id;

    const rolePermisosData: NewRolPermiso[] = [
      // Usuario regular
      { rolId: rolUsuario.id, permisoId: getPermisoId('capacitacion:ver') },
      { rolId: rolUsuario.id, permisoId: getPermisoId('capacitacion:registrarse') },
      { rolId: rolUsuario.id, permisoId: getPermisoId('area:ver') },
      { rolId: rolUsuario.id, permisoId: getPermisoId('usuario:ver') },

      // Capacitador (incluye permisos de usuario + marcar asistencia)
      { rolId: rolCapacitador.id, permisoId: getPermisoId('capacitacion:ver') },
      { rolId: rolCapacitador.id, permisoId: getPermisoId('capacitacion:registrarse') },
      { rolId: rolCapacitador.id, permisoId: getPermisoId('capacitacion:marcar_asistencia') },
      { rolId: rolCapacitador.id, permisoId: getPermisoId('area:ver') },
      { rolId: rolCapacitador.id, permisoId: getPermisoId('usuario:ver') },

      // Jefe de área (puede crear/editar capacitaciones de su área)
      { rolId: rolJefe.id, permisoId: getPermisoId('capacitacion:ver') },
      { rolId: rolJefe.id, permisoId: getPermisoId('capacitacion:crear') },
      { rolId: rolJefe.id, permisoId: getPermisoId('capacitacion:editar') },
      { rolId: rolJefe.id, permisoId: getPermisoId('capacitacion:eliminar') },
      { rolId: rolJefe.id, permisoId: getPermisoId('capacitacion:marcar_asistencia') },
      { rolId: rolJefe.id, permisoId: getPermisoId('area:ver') },
      { rolId: rolJefe.id, permisoId: getPermisoId('usuario:ver') },
      { rolId: rolJefe.id, permisoId: getPermisoId('usuario:editar') },

      // Admin (todos los permisos)
      ...insertedPermisos.map(p => ({ rolId: rolAdmin.id, permisoId: p.id })),
    ];

    await db
      .insert(rolePermisos)
      .values(rolePermisosData)
      .onConflictDoNothing()
      .returning();
    const insertedRolePermisos = await db.select().from(rolePermisos);
    console.log(`✅ ${insertedRolePermisos.length} permisos asignados a roles\n`);

    // ══════════════════════════════════════════════════════════════
    // 5. CREAR USUARIOS (14 usuarios distribuidos en áreas)
    // ══════════════════════════════════════════════════════════════
    console.log('👤 Creando usuarios...');

    // Nota: En producción, las contraseñas deben estar hasheadas con bcrypt
    // Por ahora usamos contraseñas simples para el seed
    const usuariosData: NewUsuario[] = [
      // Desarrollo (4 usuarios)
      { email: 'juan.perez@empresa.com', password: 'password123', nombre: 'Juan', apellido: 'Pérez', areaId: insertedAreas[0].id },
      { email: 'maria.garcia@empresa.com', password: 'password123', nombre: 'María', apellido: 'García', areaId: insertedAreas[0].id },
      { email: 'carlos.lopez@empresa.com', password: 'password123', nombre: 'Carlos', apellido: 'López', areaId: insertedAreas[0].id },
      { email: 'ana.martinez@empresa.com', password: 'password123', nombre: 'Ana', apellido: 'Martínez', areaId: insertedAreas[0].id },

      // Operaciones (3 usuarios)
      { email: 'luis.rodriguez@empresa.com', password: 'password123', nombre: 'Luis', apellido: 'Rodríguez', areaId: insertedAreas[1].id },
      { email: 'sofia.hernandez@empresa.com', password: 'password123', nombre: 'Sofía', apellido: 'Hernández', areaId: insertedAreas[1].id },
      { email: 'diego.torres@empresa.com', password: 'password123', nombre: 'Diego', apellido: 'Torres', areaId: insertedAreas[1].id },

      // QA (4 usuarios)
      { email: 'laura.sanchez@empresa.com', password: 'password123', nombre: 'Laura', apellido: 'Sánchez', areaId: insertedAreas[2].id },
      { email: 'pedro.ramirez@empresa.com', password: 'password123', nombre: 'Pedro', apellido: 'Ramírez', areaId: insertedAreas[2].id },
      { email: 'carmen.flores@empresa.com', password: 'password123', nombre: 'Carmen', apellido: 'Flores', areaId: insertedAreas[2].id },
      { email: 'jorge.castro@empresa.com', password: 'password123', nombre: 'Jorge', apellido: 'Castro', areaId: insertedAreas[2].id },

      // Product Manager (3 usuarios)
      { email: 'monica.diaz@empresa.com', password: 'password123', nombre: 'Mónica', apellido: 'Díaz', areaId: insertedAreas[3].id },
      { email: 'roberto.cruz@empresa.com', password: 'password123', nombre: 'Roberto', apellido: 'Cruz', areaId: insertedAreas[3].id },
      { email: 'patricia.morales@empresa.com', password: 'password123', nombre: 'Patricia', apellido: 'Morales', areaId: insertedAreas[3].id },
    ];

    await db.insert(usuarios).values(usuariosData).onConflictDoNothing();
    const insertedUsuarios = await db
      .select()
      .from(usuarios)
      .where(inArray(usuarios.email, usuariosData.map((usuario) => usuario.email)));
    insertedUsuarios.sort(
      (a, b) => usuariosData.findIndex((usuario) => usuario.email === a.email) - usuariosData.findIndex((usuario) => usuario.email === b.email)
    );
    console.log(`✅ ${insertedUsuarios.length} usuarios creados\n`);

    // ══════════════════════════════════════════════════════════════
    // 6. ASIGNAR ROLES A USUARIOS
    // ══════════════════════════════════════════════════════════════
    console.log('🎭 Asignando roles a usuarios...');

    const usuariosRolesData: NewUsuarioRol[] = [
      // Juan Pérez - Jefe de Desarrollo
      { usuarioId: insertedUsuarios[0].id, rolId: rolJefe.id },

      // María García - Capacitadora de Desarrollo
      { usuarioId: insertedUsuarios[1].id, rolId: rolCapacitador.id },

      // Carlos y Ana - Usuarios regulares de Desarrollo
      { usuarioId: insertedUsuarios[2].id, rolId: rolUsuario.id },
      { usuarioId: insertedUsuarios[3].id, rolId: rolUsuario.id },

      // Luis Rodríguez - Jefe de Operaciones
      { usuarioId: insertedUsuarios[4].id, rolId: rolJefe.id },

      // Sofía - Capacitadora de Operaciones
      { usuarioId: insertedUsuarios[5].id, rolId: rolCapacitador.id },

      // Diego - Usuario regular de Operaciones
      { usuarioId: insertedUsuarios[6].id, rolId: rolUsuario.id },

      // Laura Sánchez - Jefe de QA
      { usuarioId: insertedUsuarios[7].id, rolId: rolJefe.id },

      // Pedro - Capacitador de QA
      { usuarioId: insertedUsuarios[8].id, rolId: rolCapacitador.id },

      // Carmen y Jorge - Usuarios regulares de QA
      { usuarioId: insertedUsuarios[9].id, rolId: rolUsuario.id },
      { usuarioId: insertedUsuarios[10].id, rolId: rolUsuario.id },

      // Mónica Díaz - Jefe de Product Manager
      { usuarioId: insertedUsuarios[11].id, rolId: rolJefe.id },

      // Roberto - Capacitador de Product Manager
      { usuarioId: insertedUsuarios[12].id, rolId: rolCapacitador.id },

      // Patricia - Usuario regular de Product Manager
      { usuarioId: insertedUsuarios[13].id, rolId: rolUsuario.id },
    ];

    await db
      .insert(usuariosRoles)
      .values(usuariosRolesData)
      .onConflictDoNothing()
      .returning();
    const insertedUsuariosRoles = await db.select().from(usuariosRoles);
    console.log(`✅ ${insertedUsuariosRoles.length} roles asignados a usuarios\n`);

    // ══════════════════════════════════════════════════════════════
    // 7. ACTUALIZAR JEFES DE ÁREA
    // ══════════════════════════════════════════════════════════════
    console.log('👔 Asignando jefes a áreas...');

    await db.update(areas).set({ jefeId: insertedUsuarios[0].id }).where(eq(areas.nombre, 'Desarrollo'));
    await db.update(areas).set({ jefeId: insertedUsuarios[4].id }).where(eq(areas.nombre, 'Operaciones'));
    await db.update(areas).set({ jefeId: insertedUsuarios[7].id }).where(eq(areas.nombre, 'QA'));
    await db.update(areas).set({ jefeId: insertedUsuarios[11].id }).where(eq(areas.nombre, 'Product Manager'));

    console.log('✅ Jefes asignados a áreas\n');

    // ══════════════════════════════════════════════════════════════
    // 8. CREAR CAPACITACIONES DE EJEMPLO (3 capacitaciones)
    // ══════════════════════════════════════════════════════════════
    console.log('📚 Creando capacitaciones de ejemplo...');

    const capacitacionesData: NewCapacitacion[] = [
      {
        nombre: 'Introducción a React 19',
        descripcion: 'Capacitación sobre las nuevas características de React 19',
        areaId: insertedAreas[0].id, // Desarrollo
        capacitadorId: insertedUsuarios[1].id, // María García
        fecha: '2026-06-15',
        horaInicio: '10:00',
        duracionMinutos: 120,
        plataforma: 'Microsoft Teams',
        maxParticipantes: 20,
        estado: 'programada',
      },
      {
        nombre: 'DevOps Best Practices',
        descripcion: 'Mejores prácticas de DevOps para equipos ágiles',
        areaId: insertedAreas[1].id, // Operaciones
        capacitadorId: insertedUsuarios[5].id, // Sofía Hernández
        fecha: '2026-06-20',
        horaInicio: '14:00',
        duracionMinutos: 90,
        plataforma: 'Zoom',
        maxParticipantes: 15,
        estado: 'programada',
      },
      {
        nombre: 'Testing Automation con Playwright',
        descripcion: 'Automatización de pruebas end-to-end con Playwright',
        areaId: insertedAreas[2].id, // QA
        capacitadorId: insertedUsuarios[8].id, // Pedro Ramírez
        fecha: '2026-06-25',
        horaInicio: '11:00',
        duracionMinutos: 150,
        plataforma: 'Google Meet',
        maxParticipantes: 25,
        estado: 'programada',
      },
    ];

    const capacitacionesExistentes = await db
      .select()
      .from(capacitaciones)
      .where(inArray(capacitaciones.nombre, capacitacionesData.map((capacitacion) => capacitacion.nombre)));
    const nombresExistentes = new Set(capacitacionesExistentes.map((capacitacion) => capacitacion.nombre));
    const capacitacionesNuevas = capacitacionesData.filter((capacitacion) => !nombresExistentes.has(capacitacion.nombre));
    const insertedCapacitaciones = capacitacionesNuevas.length > 0
      ? await db.insert(capacitaciones).values(capacitacionesNuevas).returning()
      : capacitacionesExistentes;
    console.log(`✅ ${insertedCapacitaciones.length} capacitaciones creadas\n`);

    // ══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Seed completado exitosamente!\n');
    console.log('Resumen:');
    console.log(`  📁 Áreas: ${insertedAreas.length}`);
    console.log(`  👥 Roles: ${insertedRoles.length}`);
    console.log(`  🔐 Permisos: ${insertedPermisos.length}`);
    console.log(`  🔗 Permisos asignados: ${insertedRolePermisos.length}`);
    console.log(`  👤 Usuarios: ${insertedUsuarios.length}`);
    console.log(`  🎭 Roles de usuarios: ${insertedUsuariosRoles.length}`);
    console.log(`  📚 Capacitaciones: ${insertedCapacitaciones.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Credenciales de ejemplo:');
    console.log('  Email: juan.perez@empresa.com');
    console.log('  Password: password123');
    console.log('  Rol: Jefe de Desarrollo\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Ejecutar seed
seed();
