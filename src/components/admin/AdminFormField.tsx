import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type AdminFormFieldProps = {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  help?: string
  className?: string
  children: ReactNode
}

export function AdminFormField({
  label,
  htmlFor,
  required = false,
  error,
  help,
  className,
  children,
}: AdminFormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-[11px] font-medium text-stone-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      {children}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      {help && !error && <p className="text-[10px] text-stone-500">{help}</p>}
    </div>
  )
}
