import { create } from 'zustand'

interface UiStore {
  pageTitle: string
  demoBannerDismissed: boolean
  setPageTitle: (title: string) => void
  dismissDemoBanner: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  pageTitle: '',
  demoBannerDismissed: false,
  setPageTitle: (title) => set({ pageTitle: title }),
  dismissDemoBanner: () => set({ demoBannerDismissed: true }),
}))
