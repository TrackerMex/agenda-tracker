import { Link } from '@tanstack/react-router';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, CalendarClock, ExternalLink } from 'lucide-react';
import * as React from 'react';

import { CapacitacionStatusBadge } from '@/components/capacitacion/CapacitacionStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CapacitacionListItem } from '@/types';

export interface DashboardTableRow extends CapacitacionListItem {
  areaNombre?: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

const columns: ColumnDef<DashboardTableRow>[] = [
  {
    accessorKey: 'nombre',
    header: 'Capacitacion',
    cell: ({ row }) => (
      <div className="min-w-56">
        <div className="font-medium">{row.original.nombre}</div>
        <div className="text-xs text-muted-foreground">{row.original.areaNombre ?? 'Sin area'}</div>
      </div>
    ),
  },
  {
    accessorKey: 'fecha',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Fecha
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>{formatDate(row.original.fecha)}</span>
        <span className="text-muted-foreground">{row.original.hora_inicio.slice(0, 5)}</span>
      </div>
    ),
  },
  {
    accessorKey: 'plataforma',
    header: 'Plataforma',
    cell: ({ row }) => <Badge variant="outline">{row.original.plataforma}</Badge>,
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => <CapacitacionStatusBadge estado={row.original.estado} />,
  },
  {
    id: 'cupos',
    header: () => <div className="text-right">Cupos</div>,
    cell: ({ row }) => {
      const disponibles = Math.max(0, row.original.max_participantes - row.original.inscritos);
      return (
        <div className="text-right text-sm tabular-nums">
          <span className="font-medium">{disponibles}</span>
          <span className="text-muted-foreground">/{row.original.max_participantes}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link to="/capacitaciones/$id" params={{ id: String(row.original.id) }}>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Ver capacitacion</span>
        </Link>
      </Button>
    ),
  },
];

export function DataTable({ data }: { data: DashboardTableRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'fecha', desc: false },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Agenda operativa</CardTitle>
          <CardDescription>Proximas capacitaciones programadas</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/capacitaciones">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay capacitaciones programadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
