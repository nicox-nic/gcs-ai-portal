import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_TODAY } from '@/data/seedProjects'

/**
 * Demo clock — offset days from DEMO_TODAY (seed timeline anchor).
 * Default offset 0 ⇒ "now" = DEMO_TODAY so seed lastActivityAt aging is demoable.
 * Spec said "from real now"; we anchor to DEMO_TODAY so Phase 0 seeds stay coherent.
 */
type DemoClockStore = {
  offsetDays: number
  advanceDays: (n: number) => void
  setOffset: (n: number) => void
  reset: () => void
}

export const useDemoClockStore = create<DemoClockStore>()(
  persist(
    (set) => ({
      offsetDays: 0,
      advanceDays: (n) => set((state) => ({ offsetDays: state.offsetDays + n })),
      setOffset: (n) => set({ offsetDays: n }),
      reset: () => set({ offsetDays: 0 }),
    }),
    { name: 'gcs-ai-portal-democlock' },
  ),
)

export function getDemoNow(): Date {
  const offset = useDemoClockStore.getState().offsetDays
  return new Date(DEMO_TODAY.getTime() + offset * 86400000)
}

export function demoNowIso(): string {
  return getDemoNow().toISOString()
}

export function getDemoOffsetDays(): number {
  return useDemoClockStore.getState().offsetDays
}
