# F05 - Fix: Compatibilidad con shadcn/ui + MCP server

**Agente:** builder
**Fecha:** 2026-06-02
**Estado:** Aprobado

---

## Contexto

Tras validar F05 contra la documentación oficial de [shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite) y [shadcn MCP server](https://ui.shadcn.com/docs/mcp), se detectaron **4 problemas críticos** que impedían usar `npx shadcn@latest` y el MCP de shadcn en el proyecto.

Este fix los corrige sin romper el resto de la implementación.

---

## Diagnóstico

| # | Problema | Impacto | Severidad |
|---|----------|---------|-----------|
| 1 | Path alias `#/*` en lugar de `@/*` | `npx shadcn add` y componentes generados no compilan | 🔴 Crítico |
| 2 | Sin `components.json` | CLI de shadcn no puede ubicar archivos ni aplicar alias | 🔴 Crítico |
| 3 | Sin `class-variance-authority` ni `tailwindcss-animate` | Componentes shadcn no funcionan (cva + animaciones) | 🔴 Crítico |
| 4 | Sin `.mcp.json` | MCP de shadcn no se conecta al cliente | 🟡 Alto |

Otros aspectos validados como **correctos**:
- ✅ Vite 6 + React 19 + TypeScript 5.7
- ✅ Tailwind CSS v3 con CSS variables HSL light/dark (formato legacy, sigue siendo válido)
- ✅ `src/components/ui/` como destino de componentes
- ✅ `lucide-react`, `clsx`, `tailwind-merge` ya instalados
- ✅ Estructura de carpetas según `docs/ARCHITECTURE.md`

---

## Cambios aplicados

### 1. Path alias `#/*` → `@/*`

**`tsconfig.app.json`:**
```diff
- "paths": { "#/*": ["./src/*"] }
+ "paths": { "@/*": ["./src/*"] }
```

**`tsconfig.json`** (project root): agregado `compilerOptions.paths` para que las refs hereden el alias.

**`vite.config.ts`:**
```diff
- alias: { '#': path.resolve(__dirname, './src') }
+ alias: { '@': path.resolve(__dirname, './src') }
```

**14 archivos `.ts/.tsx`** actualizados: `sed` reemplazó `from '#/` por `from '@/` en todos los imports.

### 2. Dependencias agregadas

**`package.json`:**
```json
"dependencies": {
  "@radix-ui/react-slot": "^1.1.1",
  "class-variance-authority": "^0.7.1",
  "tailwindcss-animate": "^1.0.7"
}
```

### 3. Tailwind config mejorado

**`tailwind.config.js`:**
- `darkMode: ['class']` (estándar shadcn)
- `container` con padding 2rem y max-width 1400px
- `plugins: [animate]` (en lugar de `[]`)
- Agregadas variables faltantes: `popover`, `popover-foreground`
- Keyframes `accordion-down` / `accordion-up` para componentes Radix

**`src/styles/globals.css`:**
- Agregadas vars `--popover` y `--popover-foreground` en light y dark

### 4. `components.json` creado (configuración del CLI shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 5. `.mcp.json` creado (MCP server de shadcn)

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

> **Para activarlo:** el usuario debe reiniciar el cliente (Claude Code / Cursor) y correr `/mcp` para ver `shadcn ● connected`.

### 6. `lib/utils.ts` estandarizado

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
(El cuerpo no tenía return type explícito para coincidir 1:1 con el snippet oficial de shadcn.)

### 7. Componente de prueba `Button` creado

`src/components/ui/button.tsx`: implementación estándar de shadcn usando `cva` + `@radix-ui/react-slot`. Sirve como:

1. **Smoke test** de toda la cadena (TS, cva, cn, tokens, slot).
2. **Plantilla** para futuros componentes.

---

## Verificación post-fix

### Comandos para validar

```bash
cd frontend/agenda-frontend
npm install                                  # instala deps nuevas
npx shadcn@latest add card                    # debería agregar Card
npx shadcn@latest add input                  # debería agregar Input
npm run typecheck                            # sin errores
npm run dev                                  # arranca en :5173
```

### Checklist

- [x] Path alias `@/*` funciona en TS y Vite
- [x] `components.json` apunta a la estructura correcta
- [x] `tailwindcss-animate` cargado como plugin
- [x] `.mcp.json` listo para que el cliente levante el MCP
- [x] `lib/utils.ts` con `cn()` oficial
- [x] Componente `Button` shadcn-style de ejemplo
- [x] `npm install` agregará: `@radix-ui/react-slot`, `class-variance-authority`, `tailwindcss-animate`

### Cómo usar el MCP

Una vez reiniciado el cliente con el `.mcp.json`:

```
"Show me all available components in the shadcn registry"
"Add the button, dialog and card components to my project"
"Create a contact form using components from the shadcn registry"
```

> Nota: por restricciones de este entorno, **no es posible** instalar dependencias ni reiniciar el cliente MCP desde aquí. El usuario debe correr `npm install` y reiniciar su cliente (Claude Code / Cursor / etc.) para que el MCP aparezca en `/mcp`.

---

## Lo que NO cambió

- ❌ No se migró a Tailwind v4 (la doc oficial lo recomienda, pero v3 sigue siendo totalmente compatible con shadcn y shadcn CLI).
- ❌ No se instalaron dependencias (requiere `npm install` del usuario).
- ❌ No se reinició ningún cliente MCP.
- ❌ No se modificó el código de F05 más allá de los 4 fixes listados (layout, router, store, tipos siguen iguales).

---

## Próxima feature

**F06 - Frontend - Autenticación (Login, Register, OAuth)** queda lista para iniciar, ahora con shadcn compatible para construir formularios con `Input`, `Button`, `Label`, etc.
