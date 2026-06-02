# Fix Bug: Register form no se renderizaba — `/api/areas` devolvía 401

**Fecha:** 2 de junio de 2026
**Severidad:** Bloqueante (no se podían registrar usuarios nuevos)
**Estado:** Resuelto y verificado en navegador

---

## Síntoma

Al hacer clic en "Registrarse" desde el navbar o desde el link inferior de `/login`, el usuario era redirigido a `/login` en lugar de ver el formulario de registro. El reporte original ("después de registrar, redirige a /login") era engañoso: el form nunca se llegaba a renderizar.

## Causa raíz

`/register` llama a `useAreas()` (TanStack Query) para popular el `<select>` de áreas. Esa query dispara `GET /api/areas` **sin token** porque el usuario aún no está autenticado.

El backend tenía `router.use(auth)` aplicado a **todas** las rutas de `/api/areas/*`, así que la respuesta era:

```
HTTP 401 — {"success":false,"message":"Token requerido"}
```

El interceptor de Axios en `frontend/agenda-frontend/src/lib/api.ts` (línea 95) reaccionaba al 401 disparando el evento `auth:logout`. El listener en `routes/__root.tsx` (línea 19) navegaba a `/login` con `replace: true`. **Resultado**: el form nunca aparecía.

## Cambios aplicados

### 1. Backend: hacer `GET /api/areas` público

**Archivo:** `backend/src/routes/areas.js`

```diff
 const router = Router();

-router.use(auth);
-
-router.get('/', requirePermission('area:ver'), index);
-router.get('/:id/personal', requirePermission('usuario:ver'), personal);
-router.get('/:id/capacitaciones', requirePermission('capacitacion:ver'), byArea);
-router.get('/:id', requirePermission('area:ver'), show);
-router.post('/', requirePermission('area:crear'), store);
-router.put('/:id', requirePermission('area:editar'), update);
+router.get('/', index);
+router.get('/:id/personal', auth, requirePermission('usuario:ver'), personal);
+router.get('/:id/capacitaciones', auth, requirePermission('capacitacion:ver'), byArea);
+router.get('/:id', auth, requirePermission('area:ver'), show);
+router.post('/', auth, requirePermission('area:crear'), store);
+router.put('/:id', auth, requirePermission('area:editar'), update);
```

**Justificación:** El listado de áreas es información organizacional no sensible. Es necesario para que el dropdown del formulario de registro funcione. Los endpoints que exponen personal, capacitación, o que mutan, siguen requiriendo autenticación y permisos.

### 2. Frontend: defensa adicional — no auto-logout si el usuario no estaba autenticado

**Archivo:** `frontend/agenda-frontend/src/lib/api.ts` (líneas 95-101)

```diff
     if (status === 401) {
+      const wasAuthenticated = useAuthStore.getState().isAuthenticated;
       useAuthStore.getState().logout();
       localStorage.removeItem(REFRESH_STORAGE_KEY);
-      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
+      if (
+        wasAuthenticated &&
+        typeof window !== 'undefined' &&
+        window.location.pathname !== '/login'
+      ) {
         window.dispatchEvent(new CustomEvent('auth:logout'));
       }
     }
```

**Justificación:** Si el usuario NO estaba autenticado y un endpoint devuelve 401, no tiene sentido "desloguearlo" — ya está deslogueado. Solo cuando el 401 es un caso de "token expirado/inválido de un usuario previamente autenticado" corresponde forzar la salida.

## Verificación

Pruebas realizadas con `chrome-devtools`:

1. ✅ **Login** con `juan.perez@empresa.com` / `password123` → navega a `/dashboard` con saludo "Hola, Juan 👋"
2. ✅ **Logout** desde navbar → state limpio en localStorage, navega a `/login`
3. ✅ **GET `/register`** (antes del fix → 401 → /login; después del fix → form visible con 5 áreas en el dropdown)
4. ✅ **Register submit** con `Browser Test` / `browser.test@empresa.com` / área `Desarrollo` → usuario creado (id=63), navega a `/dashboard` con saludo "Hola, Browser 👋", sesión persistida
5. ✅ **Logout** desde dashboard → limpia estado y vuelve a `/login`
6. ✅ **Login + navegación a `/capacitaciones`** → muestra 5 capacitaciones con filtros y conteos correctos

## Lecciones aprendidas

- **No aplicar `router.use(auth)` globalmente** — preferir auth por ruta para mantener endpoints públicos intencionales
- **Los errores 401 no siempre significan "sesión expirada"** — pueden venir de endpoints que el usuario legítimo aún no tiene derecho a invocar (o de endpoints públicos mal protegidos)
- **El reporte del usuario puede no reflejar la causa real** — el síntoma ("redirige a /login") estaba bien, pero la causa real era otra
- **Validar siempre con el navegador, no solo por código** — el bug era invisible leyendo el código del register.tsx, solo se descubre ejecutando

## Archivos modificados

- `backend/src/routes/areas.js`
- `frontend/agenda-frontend/src/lib/api.ts`
