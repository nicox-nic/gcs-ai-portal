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
import { TRAINING_FORMATS } from '@/lib/trainingCatalog'
import { useCatalogStore } from '@/stores/catalogStore'
import type {
  SkillLevel,
  Tool,
  Training,
  TrainingAvailability,
  TrainingFormat,
} from '@/types'

type TrainingFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  training: Training | null
}

type TrainingFormState = Omit<Training, 'id'>

const EMPTY_TRAINING: TrainingFormState = {
  title: '',
  provider: '',
  format: 'Self-paced',
  durationHours: 1,
  skillLevel: 'Basic',
  toolIds: [],
  url: '',
  description: '',
  availability: 'Available',
  availableFromLabel: undefined,
}

const SKILL_LEVELS: SkillLevel[] = ['None', 'Basic', 'Intermediate', 'Advanced']
const AVAILABILITY_OPTIONS: TrainingAvailability[] = ['Available', 'ComingSoon']

function trainingToForm(training: Training): TrainingFormState {
  return {
    title: training.title,
    provider: training.provider,
    format: training.format,
    durationHours: training.durationHours,
    skillLevel: training.skillLevel,
    toolIds: [...training.toolIds],
    url: training.url,
    description: training.description,
    availability: training.availability,
    availableFromLabel: training.availableFromLabel,
  }
}

export function TrainingFormDialog({
  open,
  onOpenChange,
  training,
}: TrainingFormDialogProps) {
  const tools = useCatalogStore((state) => state.tools)
  const addTraining = useCatalogStore((state) => state.addTraining)
  const updateTraining = useCatalogStore((state) => state.updateTraining)

  const [form, setForm] = useState<TrainingFormState>(EMPTY_TRAINING)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (training) {
      setForm(trainingToForm(training))
    } else {
      setForm(EMPTY_TRAINING)
    }
    setErrors({})
  }, [open, training])

  const updateField = <K extends keyof TrainingFormState>(
    key: K,
    value: TrainingFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const toggleTool = (toolId: string, checked: boolean) => {
    setForm((previous) => ({
      ...previous,
      toolIds: checked
        ? [...previous.toolIds, toolId]
        : previous.toolIds.filter((id) => id !== toolId),
    }))
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.provider.trim()) nextErrors.provider = 'Provider is required.'
    if (!form.url.trim()) nextErrors.url = 'URL is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!Number.isFinite(form.durationHours) || form.durationHours <= 0) {
      nextErrors.durationHours = 'Duration must be greater than 0.'
    }
    if (form.availability === 'ComingSoon' && !form.availableFromLabel?.trim()) {
      nextErrors.availableFromLabel = 'Availability label is required for coming soon trainings.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const payload: Omit<Training, 'id'> = {
      ...form,
      title: form.title.trim(),
      provider: form.provider.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
      availableFromLabel:
        form.availability === 'ComingSoon'
          ? form.availableFromLabel?.trim()
          : undefined,
    }

    if (training) {
      updateTraining(training.id, payload)
      toast.success('Training updated.')
    } else {
      addTraining(payload)
      toast.success('Training added.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle className="text-sm font-semibold text-stone-900">
            {training ? 'Edit training' : 'Add training'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-stone-500">
            {training
              ? `Update catalog entry for ${training.title}.`
              : 'Create a new training in the catalog.'}
          </DialogDescription>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField
            label="Title"
            htmlFor="training-title"
            required
            error={errors.title}
            className="sm:col-span-2"
          >
            <Input
              id="training-title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField label="Provider" htmlFor="training-provider" required error={errors.provider}>
            <Input
              id="training-provider"
              value={form.provider}
              onChange={(event) => updateField('provider', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField label="Format" htmlFor="training-format" required>
            <Select
              value={form.format}
              onValueChange={(value) => updateField('format', value as TrainingFormat)}
            >
              <SelectTrigger id="training-format" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_FORMATS.map((format) => (
                  <SelectItem key={format} value={format} className="text-xs">
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminFormField>

          <AdminFormField
            label="Duration (hours)"
            htmlFor="training-duration"
            required
            error={errors.durationHours}
          >
            <Input
              id="training-duration"
              type="number"
              min={0.5}
              step={0.5}
              value={form.durationHours}
              onChange={(event) =>
                updateField('durationHours', Number(event.target.value))
              }
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField label="Skill level" htmlFor="training-skill" required>
            <Select
              value={form.skillLevel}
              onValueChange={(value) => updateField('skillLevel', value as SkillLevel)}
            >
              <SelectTrigger id="training-skill" className="text-xs">
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

          <AdminFormField label="Availability" htmlFor="training-availability" required>
            <Select
              value={form.availability}
              onValueChange={(value) => {
                const availability = value as TrainingAvailability
                updateField('availability', availability)
                if (availability === 'Available') {
                  updateField('availableFromLabel', undefined)
                }
              }}
            >
              <SelectTrigger id="training-availability" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs">
                    {option === 'ComingSoon' ? 'Coming soon' : 'Available'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminFormField>

          {form.availability === 'ComingSoon' && (
            <AdminFormField
              label="Available from label"
              htmlFor="training-available-from"
              required
              error={errors.availableFromLabel}
            >
              <Input
                id="training-available-from"
                value={form.availableFromLabel ?? ''}
                onChange={(event) =>
                  updateField('availableFromLabel', event.target.value)
                }
                className="text-xs"
                placeholder="Coming Q3 2026"
              />
            </AdminFormField>
          )}

          <AdminFormField
            label="URL"
            htmlFor="training-url"
            required
            error={errors.url}
            className="sm:col-span-2"
          >
            <Input
              id="training-url"
              value={form.url}
              onChange={(event) => updateField('url', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Description"
            htmlFor="training-description"
            required
            error={errors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="training-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="min-h-[72px] text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Linked tools"
            htmlFor="training-tools"
            className="sm:col-span-2"
          >
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-stone-200 p-2.5">
              {tools.length === 0 ? (
                <p className="text-[10px] text-stone-500">No tools in catalog.</p>
              ) : (
                tools.map((tool: Tool) => (
                  <label
                    key={tool.id}
                    className="flex cursor-pointer items-center gap-2 text-xs text-stone-700"
                  >
                    <Checkbox
                      checked={form.toolIds.includes(tool.id)}
                      onCheckedChange={(checked) => toggleTool(tool.id, checked === true)}
                    />
                    <span className="line-clamp-1">{tool.name}</span>
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
            {training ? 'Save changes' : 'Add training'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
