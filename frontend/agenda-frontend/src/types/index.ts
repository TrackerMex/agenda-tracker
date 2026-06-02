export interface Area {
  id: number;
  nombre: string;
  descripcion?: string | null;
  jefeId?: number | null;
}

export type RolNombre = 'usuario' | 'capacitador' | 'jefe_area' | 'admin';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  area_id: number;
  activo: boolean;
  roles: RolNombre[];
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: Usuario;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  area_id: number;
}

export interface OAuthPayload {
  provider_id: string;
  email: string;
  nombre: string;
  apellido: string;
  area_id: number;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type CapacitacionEstado = 'programada' | 'completada' | 'cancelada';

export interface Capacitacion {
  id: number;
  nombre: string;
  descripcion?: string | null;
  area_id: number;
  capacitador_id: number;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  plataforma: string;
  max_participantes: number;
  google_calendar_event_id?: string | null;
  outlook_calendar_event_id?: string | null;
  estado: CapacitacionEstado;
  created_at: string;
  updated_at: string;
}

export interface CapacitacionListItem extends Capacitacion {
  inscritos: number;
}

export interface CapacitacionDetalle extends Capacitacion {
  inscritos: number;
  area?: Area | null;
  capacitador?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    area_id: number;
  } | null;
  registros?: RegistroCapacitacion[];
}

export interface RegistroCapacitacion {
  id: number;
  capacitacion_id: number;
  usuario_id: number;
  registrado_en: string;
  asistio: boolean;
  comentarios?: string | null;
  created_at: string;
  updated_at: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    area_id: number;
  };
}

export interface CapacitacionConRegistro extends CapacitacionListItem {
  registro?: RegistroCapacitacion;
}

export interface CapacitacionFiltros {
  area_id?: number;
  estado?: CapacitacionEstado;
  fecha?: string;
}

export interface AsistenciaPayload {
  asistio: boolean;
  comentarios?: string;
}

export interface PersonalArea {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  area_id: number;
  activo: boolean;
  roles: RolNombre[];
}

export interface CapacitacionCreatePayload {
  nombre: string;
  descripcion?: string;
  area_id: number;
  capacitador_id: number;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  plataforma: string;
  max_participantes: number;
}
