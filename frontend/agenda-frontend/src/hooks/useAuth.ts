import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type {
  AuthSession,
  LoginCredentials,
  OAuthPayload,
  RegisterPayload,
} from '@/types';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const user = await authService.fetchMe();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

function applySession(session: AuthSession): AuthSession {
  useAuthStore.getState().setAuth(session);
  return session;
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthSession> => {
      const session = await authService.login(credentials);
      return applySession(session);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, session.user);
      void navigate({ to: '/dashboard' });
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterPayload): Promise<AuthSession> => {
      const session = await authService.register(payload);
      return applySession(session);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, session.user);
      void navigate({ to: '/dashboard' });
    },
  });
}

export function useGoogleLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OAuthPayload): Promise<AuthSession> => {
      const session = await authService.loginWithGoogle(payload);
      return applySession(session);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, session.user);
      void navigate({ to: '/dashboard' });
    },
  });
}

export function useOutlookLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OAuthPayload): Promise<AuthSession> => {
      const session = await authService.loginWithOutlook(payload);
      return applySession(session);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, session.user);
      void navigate({ to: '/dashboard' });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    useAuthStore.getState().logout();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };
}
