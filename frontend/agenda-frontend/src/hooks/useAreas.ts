import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { areasService } from '@/services/areas.service';
import type { Area, PersonalArea } from '@/types';

const AREAS_KEY = ['areas'] as const;

function personalKey(areaId: number): readonly unknown[] {
  return ['areas', areaId, 'personal'] as const;
}

export function useAreas() {
  return useQuery({
    queryKey: AREAS_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: Area[] }>('/areas');
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePersonalArea(
  areaId: number | null,
  options?: Omit<UseQueryOptions<PersonalArea[]>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PersonalArea[]>({
    queryKey: personalKey(areaId ?? 0),
    queryFn: () => areasService.getPersonal(areaId as number),
    enabled: typeof areaId === 'number' && Number.isFinite(areaId) && areaId > 0,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}
