import { Link } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
        <FileQuestion className="h-7 w-7 text-stone-400" aria-hidden />
      </div>
      <h1 className="mb-2 text-lg font-semibold text-stone-900">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm text-zinc-500">
        The page you requested does not exist or may have been moved. Use the sidebar to
        navigate, or return to the dashboard.
      </p>
      <Button
        asChild
        className="h-9 bg-indigo-600 px-4 text-sm transition-colors hover:bg-indigo-700"
      >
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}
