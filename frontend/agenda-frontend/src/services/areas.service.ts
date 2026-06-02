import { api } from '@/lib/api';
import type { Area, PersonalArea } from '@/types';

const BASE = '/areas';

export const areasService = {
  async list(): Promise<Area[]> {
    const { data } = await api.get<{ success: true; data: Area[] }>(`${BASE}`);
    return data.data;
  },

  async getPersonal(areaId: number): Promise<PersonalArea[]> {
    const { data } = await api.get<{ success: true; data: PersonalArea[] }>(
      `${BASE}/${areaId}/personal`,
    );
    return data.data;
  },
};
