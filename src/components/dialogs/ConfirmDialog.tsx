import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** Return `false` to keep the dialog open (e.g. failed validation). */
  onConfirm: () => boolean | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    const result = onConfirm()
    if (result === false) return
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-stone-900">{title}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-stone-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className={cn(
              'h-8 text-xs',
              variant === 'default' && 'bg-indigo-600 hover:bg-indigo-700',
            )}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
