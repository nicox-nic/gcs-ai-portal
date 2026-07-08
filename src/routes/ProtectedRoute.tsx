import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useIsAuthenticated, useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const currentUser = useAuthStore((state) => state.currentUser)
  const location = useLocation()
  const isComplete = useProfileStore((state) =>
    currentUser ? state.isComplete(currentUser.id) : true,
  )
  const profileSetupSkipped = useUiStore((state) => state.profileSetupSkipped)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const onSetup = location.pathname === '/profile/setup'
  if (currentUser && !isComplete && !profileSetupSkipped && !onSetup) {
    return (
      <Navigate
        to="/profile/setup"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
