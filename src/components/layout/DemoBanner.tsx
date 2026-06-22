import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'

export function DemoBanner() {
  const dismissed = useUiStore((state) => state.demoBannerDismissed)
  const dismissDemoBanner = useUiStore((state) => state.dismissDemoBanner)

  if (dismissed) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-amber-200 bg-brand-warning px-5 py-1.5 text-[11px] text-brand-warning-text">
      <span className="flex-1">
        DEMO MODE — Phase 0. Data is stored locally in your browser. No backend connected.
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-6 w-6 shrink-0 text-brand-warning-text hover:bg-amber-100/60"
        onClick={dismissDemoBanner}
        aria-label="Dismiss demo banner"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
