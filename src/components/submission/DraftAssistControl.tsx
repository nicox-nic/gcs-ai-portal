import { useState } from 'react'
import { Loader2Icon, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  applyDraftAssistDecision,
  canRequestDraftAssist,
  requestDraftAssist,
  type DraftAssistKind,
} from '@/lib/draftAssist'

type DraftAssistControlProps = {
  kind: DraftAssistKind
  value: string
  onAccept: (improved: string) => void
}

export function DraftAssistControl({ kind, value, onAccept }: DraftAssistControlProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const enabled = canRequestDraftAssist(value)

  const handleImprove = async () => {
    if (!enabled || loading) return
    setLoading(true)
    setSuggestion(null)
    try {
      const result = await requestDraftAssist(kind, value)
      if (result === null) {
        toast.message('AI assist is unavailable right now')
        return
      }
      setSuggestion(result)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (suggestion === null) return
    const next = applyDraftAssistDecision(value, suggestion, 'accept')
    onAccept(next)
    setSuggestion(null)
  }

  const handleDismiss = () => {
    setSuggestion(null)
  }

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!enabled || loading}
          onClick={() => {
            void handleImprove()
          }}
        >
          {loading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          Improve with AI
        </Button>
        {!enabled && (
          <span className="text-[10px] text-stone-500">
            Write a first draft, then improve it
          </span>
        )}
      </div>

      {suggestion !== null && (
        <div className="rounded-md border border-indigo-200 bg-indigo-50/60 px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-indigo-800">
            Suggestion
          </p>
          <p className="whitespace-pre-wrap text-xs text-stone-800">{suggestion}</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="xs" onClick={handleAccept}>
              Accept
            </Button>
            <Button type="button" variant="outline" size="xs" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
