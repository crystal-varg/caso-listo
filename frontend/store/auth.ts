import { create } from 'zustand';
import { api } from '@/lib/api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Estudio {
  id: number;
  nombre_estudio: string;
  slug: string;
}

interface AuthState {
  usuario: Usuario | null;
  estudio: Estudio | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  nombre_estudio: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  estudio: null,
  token: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api.post<any>('/auth/login', { email, password });
      localStorage.setItem('caso_listo_token', data.access_token);
      set({ usuario: data.usuario, estudio: data.estudio, token: data.access_token });
    } finally {
      set({ loading: false });
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const data = await api.post<any>('/auth/register', formData);
      localStorage.setItem('caso_listo_token', data.access_token);
      set({ usuario: data.usuario, estudio: data.estudio, token: data.access_token });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('caso_listo_token');
    set({ usuario: null, estudio: null, token: null });
  },

  hydrate: async () => {
    const token = localStorage.getItem('caso_listo_token');
    if (!token) return;
    try {
      const data = await api.get<any>('/auth/me');
      set({ usuario: data.usuario, estudio: data.estudio, token });
    } catch {
      localStorage.removeItem('caso_listo_token');
    }
  },
}));
