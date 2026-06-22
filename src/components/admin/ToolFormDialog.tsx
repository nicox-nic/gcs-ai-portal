import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminFormField } from '@/components/admin/AdminFormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { joinCommaList, parseCommaList } from '@/lib/adminFormUtils'
import { useCatalogStore } from '@/stores/catalogStore'
import type { DataSensitivity, SkillLevel, Tool, Training } from '@/types'

type ToolFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
}

type ToolFormState = Omit<Tool, 'id'>

const EMPTY_TOOL: ToolFormState = {
  name: '',
  category: '',
  vendor: '',
  description: '',
  typicalUseCases: [],
  requiredSkillLevel: 'Basic',
  maxDataSensitivity: 'Internal',
  trainingIds: [],
  gettingStartedUrl: '',
  lastReviewed: '2026-06-01',
  iconHint: '',
}

const SKILL_LEVELS: SkillLevel[] = ['None', 'Basic', 'Intermediate', 'Advanced']
const DATA_SENSITIVITIES: DataSensitivity[] = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted',
]

function toolToForm(tool: Tool): ToolFormState {
  return {
    name: tool.name,
    category: tool.category,
    vendor: tool.vendor,
    description: tool.description,
    typicalUseCases: [...tool.typicalUseCases],
    requiredSkillLevel: tool.requiredSkillLevel,
    maxDataSensitivity: tool.maxDataSensitivity,
    trainingIds: [...tool.trainingIds],
    gettingStartedUrl: tool.gettingStartedUrl,
    lastReviewed: tool.lastReviewed,
    iconHint: tool.iconHint,
  }
}

export function ToolFormDialog({ open, onOpenChange, tool }: ToolFormDialogProps) {
  const trainings = useCatalogStore((state) => state.trainings)
  const addTool = useCatalogStore((state) => state.addTool)
  const updateTool = useCatalogStore((state) => state.updateTool)

  const [form, setForm] = useState<ToolFormState>(EMPTY_TOOL)
  const [useCasesText, setUseCasesText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (tool) {
      setForm(toolToForm(tool))
      setUseCasesText(joinCommaList(tool.typicalUseCases))
    } else {
      setForm(EMPTY_TOOL)
      setUseCasesText('')
    }
    setErrors({})
  }, [open, tool])

  const updateField = <K extends keyof ToolFormState>(key: K, value: ToolFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const toggleTraining = (trainingId: string, checked: boolean) => {
    setForm((previous) => ({
      ...previous,
      trainingIds: checked
        ? [...previous.trainingIds, trainingId]
        : previous.trainingIds.filter((id) => id !== trainingId),
    }))
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required.'
    if (!form.vendor.trim()) nextErrors.vendor = 'Vendor is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.gettingStartedUrl.trim()) {
      nextErrors.gettingStartedUrl = 'Getting started URL is required.'
    }
    if (!form.lastReviewed.trim()) nextErrors.lastReviewed = 'Last reviewed date is required.'
    if (!form.iconHint.trim()) nextErrors.iconHint = 'Icon hint is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const payload: Omit<Tool, 'id'> = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      vendor: form.vendor.trim(),
      description: form.description.trim(),
      typicalUseCases: parseCommaList(useCasesText),
      gettingStartedUrl: form.gettingStartedUrl.trim(),
      iconHint: form.iconHint.trim(),
    }

    if (tool) {
      updateTool(tool.id, payload)
      toast.success('Tool updated.')
    } else {
      addTool(payload)
      toast.success('Tool added.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle className="text-sm font-semibold text-stone-900">
            {tool ? 'Edit tool' : 'Add tool'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-stone-500">
            {tool ? `Update catalog entry for ${tool.name}.` : 'Create a new tool in the catalog.'}
          </DialogDescription>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Name" htmlFor="tool-name" required error={errors.name}>
            <Input
              id="tool-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField label="Category" htmlFor="tool-category" required error={errors.category}>
            <Input
              id="tool-category"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              className="text-xs"
              placeholder="e.g. Automation"
            />
          </AdminFormField>

          <AdminFormField label="Vendor" htmlFor="tool-vendor" required error={errors.vendor}>
            <Input
              id="tool-vendor"
              value={form.vendor}
              onChange={(event) => updateField('vendor', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Required skill level"
            htmlFor="tool-skill"
            required
          >
            <Select
              value={form.requiredSkillLevel}
              onValueChange={(value) =>
                updateField('requiredSkillLevel', value as SkillLevel)
              }
            >
              <SelectTrigger id="tool-skill" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level} value={level} className="text-xs">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminFormField>

          <AdminFormField label="Max data sensitivity" htmlFor="tool-sensitivity" required>
            <Select
              value={form.maxDataSensitivity}
              onValueChange={(value) =>
                updateField('maxDataSensitivity', value as DataSensitivity)
              }
            >
              <SelectTrigger id="tool-sensitivity" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SENSITIVITIES.map((level) => (
                  <SelectItem key={level} value={level} className="text-xs">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminFormField>

          <AdminFormField
            label="Last reviewed"
            htmlFor="tool-reviewed"
            required
            error={errors.lastReviewed}
          >
            <Input
              id="tool-reviewed"
              type="date"
              value={form.lastReviewed}
              onChange={(event) => updateField('lastReviewed', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Getting started URL"
            htmlFor="tool-url"
            required
            error={errors.gettingStartedUrl}
            className="sm:col-span-2"
          >
            <Input
              id="tool-url"
              value={form.gettingStartedUrl}
              onChange={(event) => updateField('gettingStartedUrl', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Icon hint"
            htmlFor="tool-icon"
            required
            error={errors.iconHint}
            help="Lucide icon name for UI chips"
          >
            <Input
              id="tool-icon"
              value={form.iconHint}
              onChange={(event) => updateField('iconHint', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Typical use cases"
            htmlFor="tool-use-cases"
            help="Comma-separated list"
            className="sm:col-span-2"
          >
            <Input
              id="tool-use-cases"
              value={useCasesText}
              onChange={(event) => setUseCasesText(event.target.value)}
              className="text-xs"
              placeholder="Ticket routing, Approval workflows"
            />
          </AdminFormField>

          <AdminFormField
            label="Description"
            htmlFor="tool-description"
            required
            error={errors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="tool-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="min-h-[72px] text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Linked trainings"
            htmlFor="tool-trainings"
            className="sm:col-span-2"
          >
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-stone-200 p-2.5">
              {trainings.length === 0 ? (
                <p className="text-[10px] text-stone-500">No trainings in catalog.</p>
              ) : (
                trainings.map((training: Training) => (
                  <label
                    key={training.id}
                    className="flex cursor-pointer items-center gap-2 text-xs text-stone-700"
                  >
                    <Checkbox
                      checked={form.trainingIds.includes(training.id)}
                      onCheckedChange={(checked) =>
                        toggleTraining(training.id, checked === true)
                      }
                    />
                    <span className="line-clamp-1">{training.title}</span>
                  </label>
                ))
              )}
            </div>
          </AdminFormField>
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
            onClick={handleSave}
          >
            {tool ? 'Save changes' : 'Add tool'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
