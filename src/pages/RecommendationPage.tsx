import { Navigate, useParams } from 'react-router-dom'

/**
 * Legacy post-submit recommendations route.
 * Tool selection now lives on the project detail Tool Selection tab (post-qualification).
 */
export function RecommendationPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    return <Navigate to="/projects" replace />
  }
  return <Navigate to={`/projects/${id}?tab=tool-selection`} replace />
}
