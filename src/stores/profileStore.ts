import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_USERS } from '@/data/seedRoles'
import type { SkillLevel } from '@/types'

export type UserProfile = {
  skillLevel: SkillLevel
  toolChain: string[]
  integrationTargets: string[]
  profileComplete: boolean
}

export type ProfilePatch = {
  skillLevel: SkillLevel
  toolChain: string[]
  integrationTargets: string[]
}

export type IntakeProfileDefaults = {
  skillLevelAvailable: SkillLevel | ''
  existingTools: string[]
  integrationTargets: string[]
}

type ProfileStore = {
  profiles: Record<string, UserProfile>
  getProfile: (userId: string) => UserProfile | undefined
  saveProfile: (userId: string, patch: ProfilePatch) => void
  isComplete: (userId: string) => boolean
  resetProfiles: () => void
}

function seedProfilesFromUsers(): Record<string, UserProfile> {
  const profiles: Record<string, UserProfile> = {}
  for (const user of SEED_USERS) {
    if (
      user.profileComplete &&
      user.skillLevel &&
      user.toolChain &&
      user.integrationTargets
    ) {
      profiles[user.id] = {
        skillLevel: user.skillLevel,
        toolChain: [...user.toolChain],
        integrationTargets: [...user.integrationTargets],
        profileComplete: true,
      }
    }
  }
  return profiles
}

export function getProfileDefaults(userId: string): IntakeProfileDefaults {
  const profile = useProfileStore.getState().profiles[userId]
  if (!profile) {
    return {
      skillLevelAvailable: '',
      existingTools: [],
      integrationTargets: [],
    }
  }
  return {
    skillLevelAvailable: profile.skillLevel,
    existingTools: [...profile.toolChain],
    integrationTargets: [...profile.integrationTargets],
  }
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: seedProfilesFromUsers(),

      getProfile: (userId) => get().profiles[userId],

      saveProfile: (userId, patch) => {
        set((state) => ({
          profiles: {
            ...state.profiles,
            [userId]: {
              skillLevel: patch.skillLevel,
              toolChain: [...patch.toolChain],
              integrationTargets: [...patch.integrationTargets],
              profileComplete: true,
            },
          },
        }))
      },

      isComplete: (userId) => Boolean(get().profiles[userId]?.profileComplete),

      resetProfiles: () => set({ profiles: seedProfilesFromUsers() }),
    }),
    {
      name: 'gcs-ai-portal-profiles',
      partialize: (state) => ({ profiles: state.profiles }),
      merge: (persisted, current) => {
        const saved = persisted as { profiles?: Record<string, UserProfile> } | undefined
        if (!saved?.profiles || Object.keys(saved.profiles).length === 0) {
          return current
        }
        return { ...current, profiles: saved.profiles }
      },
    },
  ),
)
