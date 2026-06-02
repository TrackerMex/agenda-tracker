import { api } from '@/lib/api';
import type {
  AsistenciaPayload,
  CapacitacionConRegistro,
  CapacitacionCreatePayload,
  CapacitacionDetalle,
  CapacitacionFiltros,
  CapacitacionListItem,
  RegistroCapacitacion,
} from '@/types';

const BASE = '/capacitaciones';

function buildListQuery(filters: CapacitacionFiltros): string {
  const params = new URLSearchParams();
  if (filters.area_id !== undefined) params.set('area_id', String(filters.area_id));
  if (filters.estado) params.set('estado', filters.estado);
  if (filters.fecha) params.set('fecha', filters.fecha);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const capacitacionesService = {
  async list(filters: CapacitacionFiltros = {}): Promise<CapacitacionListItem[]> {
    const { data } = await api.get<{ success: true; data: CapacitacionListItem[] }>(
      `${BASE}${buildListQuery(filters)}`,
    );
    return data.data;
  },

  async listByArea(areaId: number): Promise<CapacitacionListItem[]> {
    const { data } = await api.get<{ success: true; data: CapacitacionListItem[] }>(
      `/areas/${areaId}/capacitaciones`,
    );
    return data.data;
  },

  async getById(id: number): Promise<CapacitacionDetalle> {
    const { data } = await api.get<{ success: true; data: CapacitacionDetalle }>(
      `${BASE}/${id}`,
    );
    return data.data;
  },

  async listByUsuario(usuarioId: number): Promise<CapacitacionConRegistro[]> {
    const { data } = await api.get<{ success: true; data: CapacitacionConRegistro[] }>(
      `/usuarios/${usuarioId}/capacitaciones`,
    );
    return data.data;
  },

  async registrar(capacitacionId: number): Promise<RegistroCapacitacion> {
    const { data } = await api.post<{ success: true; data: RegistroCapacitacion }>(
      `${BASE}/${capacitacionId}/registrar`,
    );
    return data.data;
  },

  async desregistrar(capacitacionId: number, usuarioId: number): Promise<RegistroCapacitacion> {
    const { data } = await api.delete<{ success: true; data: RegistroCapacitacion }>(
      `${BASE}/${capacitacionId}/registrar/${usuarioId}`,
    );
    return data.data;
  },

  async marcarAsistencia(
    capacitacionId: number,
    usuarioId: number,
    payload: AsistenciaPayload,
  ): Promise<RegistroCapacitacion> {
    const { data } = await api.put<{ success: true; data: RegistroCapacitacion }>(
      `${BASE}/${capacitacionId}/registrar/${usuarioId}/asistencia`,
      payload,
    );
    return data.data;
  },

  async create(payload: CapacitacionCreatePayload): Promise<CapacitacionDetalle> {
    const { data } = await api.post<{ success: true; data: CapacitacionDetalle }>(
      BASE,
      payload,
    );
    return data.data;
  },
};
