import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'

export const AUTH_PERSIST_KEY = 'gcs-ai-portal-auth'
export const CATALOG_PERSIST_KEY = 'gcs-ai-portal-catalog'
export const PROJECTS_PERSIST_KEY = 'gcs-ai-portal-projects'

const AUTH_KEY = AUTH_PERSIST_KEY
const CATALOG_KEY = CATALOG_PERSIST_KEY
const PROJECTS_KEY = PROJECTS_PERSIST_KEY

export function clearAllLocalData(): void {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(CATALOG_KEY)
  localStorage.removeItem(PROJECTS_KEY)
  window.location.reload()
}

/** Instantiate persisted stores on app load and seed localStorage when keys are missing. */
export async function bootstrapStores(): Promise<void> {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useCatalogStore.persist.rehydrate(),
    useProjectsStore.persist.rehydrate(),
  ])

  if (!localStorage.getItem(CATALOG_KEY)) {
    useCatalogStore.getState().resetCatalog()
  }

  if (!localStorage.getItem(PROJECTS_KEY)) {
    useProjectsStore.getState().resetProjects()
  }

  if (!localStorage.getItem(AUTH_KEY)) {
    useAuthStore.setState({ currentUser: null })
  }
}
