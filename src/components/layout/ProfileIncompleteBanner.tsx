import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'

export function ProfileIncompleteBanner() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const isComplete = useProfileStore((state) =>
    currentUser ? state.isComplete(currentUser.id) : true,
  )
  const dismissed = useUiStore((state) => state.profileBannerDismissed)
  const dismissProfileBanner = useUiStore((state) => state.dismissProfileBanner)

  if (!currentUser || isComplete || dismissed) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-indigo-200 bg-indigo-50 px-5 py-1.5 text-[11px] text-indigo-900">
      <span className="flex-1">
        Complete your profile to pre-fill new submissions.{' '}
        <Link to="/profile/setup" className="font-medium underline underline-offset-2">
          Set up now
        </Link>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-6 w-6 shrink-0 text-indigo-900 hover:bg-indigo-100/60"
        onClick={dismissProfileBanner}
        aria-label="Dismiss profile banner"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
