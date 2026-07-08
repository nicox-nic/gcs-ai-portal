import { create } from 'zustand'

interface UiStore {
  pageTitle: string
  demoBannerDismissed: boolean
  /** Session-only: skip first-login profile redirect for the rest of this session. */
  profileSetupSkipped: boolean
  profileBannerDismissed: boolean
  setPageTitle: (title: string) => void
  dismissDemoBanner: () => void
  skipProfileSetup: () => void
  dismissProfileBanner: () => void
  resetProfileSessionFlags: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  pageTitle: '',
  demoBannerDismissed: false,
  profileSetupSkipped: false,
  profileBannerDismissed: false,
  setPageTitle: (title) => set({ pageTitle: title }),
  dismissDemoBanner: () => set({ demoBannerDismissed: true }),
  skipProfileSetup: () => set({ profileSetupSkipped: true }),
  dismissProfileBanner: () => set({ profileBannerDismissed: true }),
  resetProfileSessionFlags: () =>
    set({ profileSetupSkipped: false, profileBannerDismissed: false }),
}))
