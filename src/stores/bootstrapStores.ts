import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useDemoClockStore } from '@/stores/demoClockStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useProfileStore } from '@/stores/profileStore'
import { useProjectsStore } from '@/stores/projectsStore'

export const AUTH_PERSIST_KEY = 'gcs-ai-portal-auth'
export const CATALOG_PERSIST_KEY = 'gcs-ai-portal-catalog'
export const PROJECTS_PERSIST_KEY = 'gcs-ai-portal-projects'
export const PROFILES_PERSIST_KEY = 'gcs-ai-portal-profiles'
export const DEMO_CLOCK_PERSIST_KEY = 'gcs-ai-portal-democlock'
export const NOTIFICATIONS_PERSIST_KEY = 'gcs-ai-portal-notifications'

const AUTH_KEY = AUTH_PERSIST_KEY
const CATALOG_KEY = CATALOG_PERSIST_KEY
const PROJECTS_KEY = PROJECTS_PERSIST_KEY
const PROFILES_KEY = PROFILES_PERSIST_KEY
const DEMO_CLOCK_KEY = DEMO_CLOCK_PERSIST_KEY
const NOTIFICATIONS_KEY = NOTIFICATIONS_PERSIST_KEY

export function clearAllLocalData(): void {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(CATALOG_KEY)
  localStorage.removeItem(PROJECTS_KEY)
  localStorage.removeItem(PROFILES_KEY)
  localStorage.removeItem(DEMO_CLOCK_KEY)
  localStorage.removeItem(NOTIFICATIONS_KEY)
  window.location.reload()
}

/** Instantiate persisted stores on app load and seed localStorage when keys are missing. */
export async function bootstrapStores(): Promise<void> {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useCatalogStore.persist.rehydrate(),
    useProjectsStore.persist.rehydrate(),
    useProfileStore.persist.rehydrate(),
    useDemoClockStore.persist.rehydrate(),
    useNotificationsStore.persist.rehydrate(),
  ])

  if (!localStorage.getItem(CATALOG_KEY)) {
    useCatalogStore.getState().resetCatalog()
  }

  if (!localStorage.getItem(PROJECTS_KEY)) {
    useProjectsStore.getState().resetProjects()
  }

  if (!localStorage.getItem(PROFILES_KEY)) {
    useProfileStore.getState().resetProfiles()
  }

  if (!localStorage.getItem(AUTH_KEY)) {
    useAuthStore.setState({ currentUser: null })
  }

  if (!localStorage.getItem(DEMO_CLOCK_KEY)) {
    useDemoClockStore.getState().reset()
  }

  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    useNotificationsStore.getState().clear()
  }

  useProjectsStore.getState().runAging()
}
