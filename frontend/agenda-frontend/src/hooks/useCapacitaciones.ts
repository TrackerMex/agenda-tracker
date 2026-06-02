import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { capacitacionesService } from '@/services/capacitaciones.service';
import { useAuthStore } from '@/store/authStore';
import type {
  AsistenciaPayload,
  CapacitacionConRegistro,
  CapacitacionCreatePayload,
  CapacitacionDetalle,
  CapacitacionFiltros,
  CapacitacionListItem,
} from '@/types';

const KEY_ALL = ['capacitaciones'] as const;
const KEY_MIAS = ['capacitaciones', 'mias'] as const;

function filtrosKey(filtros: CapacitacionFiltros): readonly unknown[] {
  return ['capacitaciones', 'list', filtros] as const;
}

function detalleKey(id: number): readonly unknown[] {
  return ['capacitaciones', 'detalle', id] as const;
}

function byAreaKey(areaId: number): readonly unknown[] {
  return ['capacitaciones', 'byArea', areaId] as const;
}

export function useCapacitaciones(
  filtros: CapacitacionFiltros = {},
  options?: Omit<UseQueryOptions<CapacitacionListItem[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CapacitacionListItem[]>({
    queryKey: filtrosKey(filtros),
    queryFn: () => capacitacionesService.list(filtros),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useCapacitacion(id: number) {
  return useQuery<CapacitacionDetalle>({
    queryKey: detalleKey(id),
    queryFn: () => capacitacionesService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCapacitacionesByArea(areaId: number | null) {
  return useQuery<CapacitacionListItem[]>({
    queryKey: byAreaKey(areaId ?? 0),
    queryFn: () => capacitacionesService.listByArea(areaId as number),
    enabled: typeof areaId === 'number' && Number.isFinite(areaId) && areaId > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMisCapacitaciones() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<CapacitacionConRegistro[]>({
    queryKey: KEY_MIAS,
    queryFn: () => capacitacionesService.listByUsuario(userId as number),
    enabled: typeof userId === 'number',
    staleTime: 2 * 60 * 1000,
  });
}

export function useRegistrarmeACapacitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (capacitacionId: number) => capacitacionesService.registrar(capacitacionId),
    onSuccess: (_data, capacitacionId) => {
      void queryClient.invalidateQueries({ queryKey: KEY_ALL });
      void queryClient.invalidateQueries({ queryKey: KEY_MIAS });
      void queryClient.invalidateQueries({ queryKey: detalleKey(capacitacionId) });
    },
  });
}

export function useDesregistrarmeDeCapacitacion() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (capacitacionId: number) =>
      capacitacionesService.desregistrar(capacitacionId, userId as number),
    onSuccess: (_data, capacitacionId) => {
      void queryClient.invalidateQueries({ queryKey: KEY_ALL });
      void queryClient.invalidateQueries({ queryKey: KEY_MIAS });
      void queryClient.invalidateQueries({ queryKey: detalleKey(capacitacionId) });
    },
  });
}

export function useMarcarAsistencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      capacitacionId,
      usuarioId,
      payload,
    }: {
      capacitacionId: number;
      usuarioId: number;
      payload: AsistenciaPayload;
    }) => capacitacionesService.marcarAsistencia(capacitacionId, usuarioId, payload),
    onSuccess: (_data, { capacitacionId }) => {
      void queryClient.invalidateQueries({ queryKey: KEY_ALL });
      void queryClient.invalidateQueries({ queryKey: detalleKey(capacitacionId) });
    },
  });
}

export function useCreateCapacitacion() {
  const queryClient = useQueryClient();

  return useMutation<CapacitacionDetalle, unknown, CapacitacionCreatePayload>({
    mutationFn: (payload) => capacitacionesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY_ALL });
      void queryClient.invalidateQueries({ queryKey: KEY_MIAS });
    },
  });
}
