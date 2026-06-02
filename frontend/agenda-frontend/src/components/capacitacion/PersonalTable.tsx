import { Mail, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/capacitacion/EmptyState';
import type { PersonalArea, RolNombre } from '@/types';

export interface PersonalTableProps {
  personal: PersonalArea[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const ROLE_BADGE: Record<RolNombre, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' }> = {
  admin: { label: 'Admin', variant: 'destructive' },
  jefe_area: { label: 'Jefe', variant: 'success' },
  capacitador: { label: 'Capacitador', variant: 'warning' },
  usuario: { label: 'Usuario', variant: 'outline' },
};

function formatRoles(roles: RolNombre[]): RolNombre[] {
  const order: RolNombre[] = ['admin', 'jefe_area', 'capacitador', 'usuario'];
  return [...roles].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function PersonalTable({
  personal,
  isLoading = false,
  emptyTitle = 'No hay personal registrado',
  emptyDescription = 'Cuando se asignen usuarios al area, apareceran aca.',
}: PersonalTableProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return personal;
    return personal.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
      return (
        fullName.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.roles.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [personal, search]);

  if (!isLoading && personal.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={Users} />;
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Buscar por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Buscar personal"
          disabled={isLoading}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Persona
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Roles
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-3 w-32 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-40 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-20 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-12 rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No se encontraron personas con el filtro actual.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">
                      {p.nombre} {p.apellido}
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {p.email}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {formatRoles(p.roles).map((rol) => {
                          const cfg = ROLE_BADGE[rol];
                          return (
                            <Badge key={rol} variant={cfg.variant} className="text-[10px]">
                              {cfg.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.activo ? 'success' : 'destructive'}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {personal.length} persona{personal.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  );
}
