import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  name: string;
  role: 'admin' | 'engineer' | 'viewer';
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            set({ error: data.detail ?? 'Invalid credentials', isLoading: false });
            return false;
          }
          const data = await res.json();
          set({
            token: data.access_token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch {
          set({ error: 'Network error — is the backend running?', isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'smriti-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
