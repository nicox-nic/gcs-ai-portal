import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '@/pages/AdminPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProfileSetupPage } from '@/pages/ProfileSetupPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ProjectsListPage } from '@/pages/ProjectsListPage'
import { RecommendationPage } from '@/pages/RecommendationPage'
import { SubmitProjectPage } from '@/pages/SubmitProjectPage'
import { TrainingCatalogPage } from '@/pages/TrainingCatalogPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useIsAuthenticated } from '@/stores/authStore'

function LoginRoute() {
  const isAuthenticated = useIsAuthenticated()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <LoginPage />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit" element={<SubmitProjectPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/recommendations" element={<RecommendationPage />} />
        <Route path="/trainings" element={<TrainingCatalogPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/setup" element={<ProfileSetupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
