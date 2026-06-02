import { api } from '@/lib/api';
import type {
  AuthSession,
  LoginCredentials,
  OAuthPayload,
  RegisterPayload,
} from '@/types';

const AUTH_BASE = '/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { data } = await api.post<{ success: true } & AuthSession>(
      `${AUTH_BASE}/login`,
      credentials,
    );
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const { data } = await api.post<{ success: true } & AuthSession>(
      `${AUTH_BASE}/register`,
      payload,
    );
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  },

  async loginWithGoogle(payload: OAuthPayload): Promise<AuthSession> {
    const { data } = await api.post<{ success: true } & AuthSession>(
      `${AUTH_BASE}/google`,
      payload,
    );
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  },

  async loginWithOutlook(payload: OAuthPayload): Promise<AuthSession> {
    const { data } = await api.post<{ success: true } & AuthSession>(
      `${AUTH_BASE}/outlook`,
      payload,
    );
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  },

  async fetchMe(): Promise<AuthSession['user']> {
    const { data } = await api.get<{ success: true; user: AuthSession['user'] }>(
      `${AUTH_BASE}/me`,
    );
    return data.user;
  },
};
