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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  nombre_estudio: string;
}

/**
 * The auth token is never stored in JavaScript. It lives in httpOnly cookies
 * set by the backend. This store holds only the user-visible profile state so
 * the UI can render the current user. XSS cannot exfiltrate credentials because
 * JS has no path to read the cookie.
 */
export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  estudio: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api.post<{ usuario: Usuario; estudio: Estudio }>(
        '/auth/login',
        { email, password },
      );
      set({ usuario: data.usuario, estudio: data.estudio });
    } finally {
      set({ loading: false });
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const data = await api.post<{ usuario: Usuario; estudio: Estudio }>(
        '/auth/register',
        formData,
      );
      set({ usuario: data.usuario, estudio: data.estudio });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Logout is best-effort — clear client state regardless.
    }
    set({ usuario: null, estudio: null });
  },

  hydrate: async () => {
    try {
      const data = await api.get<{ usuario: Usuario | null; estudio: Estudio | null }>(
        '/auth/me',
      );
      if (data?.usuario) {
        set({ usuario: data.usuario, estudio: data.estudio });
      } else {
        set({ usuario: null, estudio: null });
      }
    } catch {
      set({ usuario: null, estudio: null });
    }
  },
}));
