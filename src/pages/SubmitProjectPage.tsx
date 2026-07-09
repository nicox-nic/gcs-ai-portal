import { useEffect } from 'react'
import { ClipboardPen, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { SUBMIT_ROLES } from '@/lib/roles'
import { useAuthStore } from '@/stores/authStore'

export function SubmitProjectPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canSubmitRole = currentUser && SUBMIT_ROLES.includes(currentUser.role)

  useEffect(() => {
    if (currentUser && !SUBMIT_ROLES.includes(currentUser.role)) {
      toast.error('Your role cannot submit new projects.')
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  if (!canSubmitRole) {
    return null
  }

  return (
    <>
      <PageHeader
        title="Submit New AI Project"
        subtitle="Choose how you want to describe your initiative — manual form or AI-assisted guided builder."
        className="mb-5"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/submit/manual"
          className="rounded-lg border-[0.5px] border-stone-200 bg-white p-5 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
            <ClipboardPen className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium text-stone-900">Manual entry</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
            Complete the 4-step wizard yourself — title, use case, data, and readiness. Best when
            you already know the details.
          </p>
          <span className="mt-4 inline-block text-xs font-medium text-indigo-700">
            Continue with form →
          </span>
        </Link>

        <Link
          to="/submit/assisted"
          className="rounded-lg border-[0.5px] border-stone-200 bg-white p-5 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium text-stone-900">AI-assisted</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
            Answer WHAT / WHY / HOW / WHO, check for similar projects, then review a generated use
            case you can edit before saving or submitting.
          </p>
          <span className="mt-4 inline-block text-xs font-medium text-indigo-700">
            Start guided builder →
          </span>
        </Link>
      </div>
    </>
  )
}
