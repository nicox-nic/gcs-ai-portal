import type { Group, Site } from '@/types'

export const GROUP_HEADCOUNT: Record<Group, number> = {
  Engineering: 150,
  Field: 420,
  PROGs: 980,
  Marketing: 16,
}

export const SITE_HEADCOUNT: Record<Site, number> = {
  Cebu: 1820,
  'Costa Rica': 310,
  Japan: 250,
  Korea: 112,
}
