import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiErrorBody } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';
const REFRESH_STORAGE_KEY = 'agenda-auth';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<{ success: true; token: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );

    if (response.data.success) {
      const { token, refreshToken: newRefresh } = response.data;
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setAuth({ token, refreshToken: newRefresh, user });
      }
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await performRefresh();
        isRefreshing = false;
        processQueue(newToken);

        if (newToken) {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          return api(originalRequest);
        }
      } else {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              originalRequest.headers.set('Authorization', `Bearer ${token}`);
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }
    }

    if (status === 401) {
      const wasAuthenticated = useAuthStore.getState().isAuthenticated;
      useAuthStore.getState().logout();
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      if (
        wasAuthenticated &&
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }

    return Promise.reject(error);
  },
);

export const REFRESH_KEY = REFRESH_STORAGE_KEY;

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError<ApiErrorBody>(error);
}

export function getErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  if (isApiError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  if (isApiError(error)) {
    return error.response?.data?.errors ?? {};
  }
  return {};
}
