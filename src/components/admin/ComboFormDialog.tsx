import { useEffect, useMemo, useState } from 'react'
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
import { joinCommaList, joinMultilineList, parseCommaList, parseMultilineList } from '@/lib/adminFormUtils'
import { useCatalogStore } from '@/stores/catalogStore'
import type { SkillLevel, Tool, ToolCombo } from '@/types'

type ComboFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo: ToolCombo | null
}

type ComboFormState = Omit<ToolCombo, 'id'>

const EMPTY_COMBO: ComboFormState = {
  name: '',
  description: '',
  primaryToolId: '',
  addOnToolIds: [],
  addOnRoles: {},
  matchScore: 70,
  bestForKeywords: [],
  skillLevelRequired: 'Intermediate',
  riskFlags: [],
}

const SKILL_LEVELS: SkillLevel[] = ['None', 'Basic', 'Intermediate', 'Advanced']

function comboToForm(combo: ToolCombo): ComboFormState {
  return {
    name: combo.name,
    description: combo.description,
    primaryToolId: combo.primaryToolId,
    addOnToolIds: [...combo.addOnToolIds],
    addOnRoles: { ...combo.addOnRoles },
    matchScore: combo.matchScore,
    bestForKeywords: [...combo.bestForKeywords],
    skillLevelRequired: combo.skillLevelRequired,
    riskFlags: [...combo.riskFlags],
  }
}

export function ComboFormDialog({ open, onOpenChange, combo }: ComboFormDialogProps) {
  const tools = useCatalogStore((state) => state.tools)
  const addCombo = useCatalogStore((state) => state.addCombo)
  const updateCombo = useCatalogStore((state) => state.updateCombo)

  const [form, setForm] = useState<ComboFormState>(EMPTY_COMBO)
  const [keywordsText, setKeywordsText] = useState('')
  const [riskFlagsText, setRiskFlagsText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (combo) {
      setForm(comboToForm(combo))
      setKeywordsText(joinCommaList(combo.bestForKeywords))
      setRiskFlagsText(joinMultilineList(combo.riskFlags))
    } else {
      setForm({
        ...EMPTY_COMBO,
        primaryToolId: tools[0]?.id ?? '',
      })
      setKeywordsText('')
      setRiskFlagsText('')
    }
    setErrors({})
  }, [open, combo, tools])

  const addOnCandidates = useMemo(
    () => tools.filter((tool) => tool.id !== form.primaryToolId),
    [tools, form.primaryToolId],
  )

  const updateField = <K extends keyof ComboFormState>(key: K, value: ComboFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const handlePrimaryChange = (primaryToolId: string) => {
    setForm((previous) => {
      const addOnToolIds = previous.addOnToolIds.filter((id) => id !== primaryToolId)
      const addOnRoles = { ...previous.addOnRoles }
      for (const key of Object.keys(addOnRoles)) {
        if (!addOnToolIds.includes(key)) delete addOnRoles[key]
      }
      return { ...previous, primaryToolId, addOnToolIds, addOnRoles }
    })
  }

  const toggleAddOn = (toolId: string, checked: boolean) => {
    setForm((previous) => {
      const addOnToolIds = checked
        ? [...previous.addOnToolIds, toolId]
        : previous.addOnToolIds.filter((id) => id !== toolId)
      const addOnRoles = { ...previous.addOnRoles }
      if (checked) {
        addOnRoles[toolId] = addOnRoles[toolId] ?? ''
      } else {
        delete addOnRoles[toolId]
      }
      return { ...previous, addOnToolIds, addOnRoles }
    })
  }

  const updateAddOnRole = (toolId: string, role: string) => {
    setForm((previous) => ({
      ...previous,
      addOnRoles: { ...previous.addOnRoles, [toolId]: role },
    }))
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.primaryToolId) nextErrors.primaryToolId = 'Primary tool is required.'
    if (!Number.isFinite(form.matchScore) || form.matchScore < 0 || form.matchScore > 100) {
      nextErrors.matchScore = 'Match score must be between 0 and 100.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const payload: Omit<ToolCombo, 'id'> = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      bestForKeywords: parseCommaList(keywordsText),
      riskFlags: parseMultilineList(riskFlagsText),
      matchScore: Math.round(form.matchScore),
    }

    if (combo) {
      updateCombo(combo.id, payload)
      toast.success('Combo updated.')
    } else {
      addCombo(payload)
      toast.success('Combo added.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle className="text-sm font-semibold text-stone-900">
            {combo ? 'Edit combo' : 'Add combo'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-stone-500">
            {combo
              ? `Update stack combo ${combo.name}.`
              : 'Create a pre-built tool stack combo for recommendations.'}
          </DialogDescription>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField
            label="Name"
            htmlFor="combo-name"
            required
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              id="combo-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Description"
            htmlFor="combo-description"
            required
            error={errors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="combo-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="min-h-[72px] text-xs"
            />
          </AdminFormField>

          <AdminFormField
            label="Primary tool"
            htmlFor="combo-primary"
            required
            error={errors.primaryToolId}
          >
            <Select value={form.primaryToolId} onValueChange={handlePrimaryChange}>
              <SelectTrigger id="combo-primary" className="text-xs">
                <SelectValue placeholder="Select primary tool" />
              </SelectTrigger>
              <SelectContent>
                {tools.map((tool: Tool) => (
                  <SelectItem key={tool.id} value={tool.id} className="text-xs">
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminFormField>

          <AdminFormField
            label="Match score"
            htmlFor="combo-score"
            required
            error={errors.matchScore}
          >
            <Input
              id="combo-score"
              type="number"
              min={0}
              max={100}
              value={form.matchScore}
              onChange={(event) => updateField('matchScore', Number(event.target.value))}
              className="text-xs"
            />
          </AdminFormField>

          <AdminFormField label="Skill level required" htmlFor="combo-skill" required>
            <Select
              value={form.skillLevelRequired}
              onValueChange={(value) =>
                updateField('skillLevelRequired', value as SkillLevel)
              }
            >
              <SelectTrigger id="combo-skill" className="text-xs">
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

          <AdminFormField
            label="Best-for keywords"
            htmlFor="combo-keywords"
            help="Comma-separated"
            className="sm:col-span-2"
          >
            <Input
              id="combo-keywords"
              value={keywordsText}
              onChange={(event) => setKeywordsText(event.target.value)}
              className="text-xs"
              placeholder="triage, ticket, agent"
            />
          </AdminFormField>

          <AdminFormField
            label="Risk flags"
            htmlFor="combo-risks"
            help="One flag per line"
            className="sm:col-span-2"
          >
            <Textarea
              id="combo-risks"
              value={riskFlagsText}
              onChange={(event) => setRiskFlagsText(event.target.value)}
              className="min-h-[64px] text-xs"
              placeholder="Requires Advanced skill level"
            />
          </AdminFormField>

          <AdminFormField
            label="Add-on tools"
            htmlFor="combo-addons"
            className="sm:col-span-2"
          >
            <div className="space-y-3 rounded-md border border-stone-200 p-2.5">
              {addOnCandidates.length === 0 ? (
                <p className="text-[10px] text-stone-500">No add-on tools available.</p>
              ) : (
                addOnCandidates.map((tool) => (
                  <div key={tool.id} className="space-y-1.5">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700">
                      <Checkbox
                        checked={form.addOnToolIds.includes(tool.id)}
                        onCheckedChange={(checked) => toggleAddOn(tool.id, checked === true)}
                      />
                      <span>{tool.name}</span>
                    </label>
                    {form.addOnToolIds.includes(tool.id) && (
                      <Input
                        value={form.addOnRoles[tool.id] ?? ''}
                        onChange={(event) => updateAddOnRole(tool.id, event.target.value)}
                        className="ml-6 h-8 text-xs"
                        placeholder="Add-on role (e.g. Knowledge store)"
                      />
                    )}
                  </div>
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
            {combo ? 'Save changes' : 'Add combo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
