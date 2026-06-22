import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { StageTransitionOption } from '@/lib/lifecycle'

type AdvanceStageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transition: StageTransitionOption | null
  onConfirm: (note: string) => void
}

export function AdvanceStageDialog({
  open,
  onOpenChange,
  transition,
  onConfirm,
}: AdvanceStageDialogProps) {
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    onConfirm(note.trim())
    setNote('')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setNote('')
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-md gap-4">
        <div>
          <DialogTitle className="text-sm font-semibold text-stone-900">
            Confirm stage transition
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-stone-500">
            {transition?.label ?? 'Apply this lifecycle transition.'}
          </DialogDescription>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] text-stone-700">
            Note (optional)
          </label>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-[80px] text-xs"
            placeholder="Add context for the audit log…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
