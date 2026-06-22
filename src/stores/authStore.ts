import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  currentUser: User | null
  loginAs: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      loginAs: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    { name: 'gcs-ai-portal-auth' },
  ),
)

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.currentUser !== null)
}
