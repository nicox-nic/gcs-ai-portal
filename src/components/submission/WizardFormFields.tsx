import { Lock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SEED_TOOLS } from '@/data/seedTools'
import {
  INTEGRATION_TARGET_OPTIONS,
  type WizardFormState,
} from '@/lib/submissionWizard'
import { cn } from '@/lib/utils'
import type {
  DataAccessStatus,
  DataSensitivity,
  Group,
  Site,
  SkillLevel,
} from '@/types'

const GROUPS: Group[] = ['Engineering', 'Field', 'PROGs', 'Marketing']
const SITES: Site[] = ['Cebu', 'Costa Rica', 'Japan', 'Korea']
const SENSITIVITY_OPTIONS: DataSensitivity[] = ['Public', 'Internal', 'Confidential', 'Restricted']
const ACCESS_OPTIONS: DataAccessStatus[] = ['Available', 'NeedAccess', 'Unknown']
const SKILL_OPTIONS: SkillLevel[] = ['None', 'Basic', 'Intermediate', 'Advanced']

function RequiredMark() {
  return <span className="text-red-600">*</span>
}

function StepSectionHeader({
  stepNumber,
  title,
  variant,
  hint,
}: {
  stepNumber: number
  title: string
  variant: 'active' | 'locked' | 'done'
  hint?: string
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2 border-b-[0.5px] border-stone-200 pb-2.5">
      <div
        className={cn(
          'flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold',
          variant === 'active' && 'bg-indigo-600 text-white',
          variant === 'done' && 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900',
          variant === 'locked' && 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900',
        )}
      >
        {stepNumber}
      </div>
      <span className="text-[13px] font-medium text-stone-900">{title}</span>
      {hint && <span className="ml-auto text-[10px] text-stone-500">{hint}</span>}
    </div>
  )
}

function LockedStepPreview({ previousStep }: { previousStep: number }) {
  return (
    <div className="mt-5 rounded-md bg-stone-100 px-5 py-8 text-center">
      <Lock className="mx-auto mb-1.5 h-5 w-5 text-stone-400" />
      <p className="text-xs text-stone-500">Complete Step {previousStep} to unlock</p>
    </div>
  )
}

type WizardFormFieldsProps = {
  currentStep: number
  form: WizardFormState
  onChange: (patch: Partial<WizardFormState>) => void
}

export function WizardFormFields({ currentStep, form, onChange }: WizardFormFieldsProps) {
  const toggleExistingTool = (toolName: string, checked: boolean) => {
    onChange({
      existingTools: checked
        ? [...form.existingTools, toolName]
        : form.existingTools.filter((name) => name !== toolName),
    })
  }

  const toggleIntegration = (target: string, checked: boolean) => {
    onChange({
      integrationTargets: checked
        ? [...form.integrationTargets, target]
        : form.integrationTargets.filter((value) => value !== target),
    })
  }

  return (
    <div>
      {currentStep === 1 && (
        <section>
          <StepSectionHeader stepNumber={1} title="Basics" variant="active" />
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Project Title <RequiredMark />
              </Label>
              <Input
                value={form.title}
                onChange={(event) => onChange({ title: event.target.value })}
                className="h-9 text-xs"
                placeholder="e.g. Service Ticket Triage Copilot"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Group <RequiredMark />
                </Label>
                <Select
                  value={form.group || undefined}
                  onValueChange={(value) => onChange({ group: value as Group })}
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPS.map((group) => (
                      <SelectItem key={group} value={group} className="text-xs">
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Site <RequiredMark />
                </Label>
                <Select
                  value={form.site || undefined}
                  onValueChange={(value) => onChange({ site: value as Site })}
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {SITES.map((site) => (
                      <SelectItem key={site} value={site} className="text-xs">
                        {site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Department <RequiredMark />
                </Label>
                <Input
                  value={form.department}
                  onChange={(event) => onChange({ department: event.target.value })}
                  className="h-9 text-xs"
                  placeholder="Customer Service Operations"
                />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Target Users <RequiredMark />
                </Label>
                <Input
                  value={form.targetUsers}
                  onChange={(event) => onChange({ targetUsers: event.target.value })}
                  className="h-9 text-xs"
                  placeholder="Field service engineers"
                />
              </div>
            </div>
          </div>
          <section className="mt-5">
            <StepSectionHeader
              stepNumber={2}
              title="Use Case"
              variant="locked"
              hint="Step 2 of 4 — fills after advancing"
            />
            <LockedStepPreview previousStep={1} />
          </section>
        </section>
      )}

      {currentStep === 2 && (
        <section>
          <StepSectionHeader stepNumber={2} title="Use Case" variant="active" />
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Use Case <RequiredMark />
              </Label>
              <Input
                value={form.useCase}
                onChange={(event) => onChange({ useCase: event.target.value })}
                className="h-9 text-xs"
                placeholder="Conversational Q&A agent for field engineers"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Problem <RequiredMark />
              </Label>
              <Textarea
                value={form.problem}
                onChange={(event) => onChange({ problem: event.target.value })}
                className="min-h-[88px] text-xs"
                placeholder="Describe the pain point your team faces today."
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Goal <RequiredMark />
              </Label>
              <Textarea
                value={form.goal}
                onChange={(event) => onChange({ goal: event.target.value })}
                className="min-h-[88px] text-xs"
                placeholder="What should the AI solution accomplish?"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Expected Outcome <RequiredMark />
              </Label>
              <Textarea
                value={form.expectedOutcome}
                onChange={(event) => onChange({ expectedOutcome: event.target.value })}
                className="min-h-[72px] text-xs"
                placeholder="How will you measure success?"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Expected Benefit (hours saved per month) <RequiredMark />
              </Label>
              <Input
                type="number"
                min={1}
                value={form.expectedBenefitHours}
                onChange={(event) => onChange({ expectedBenefitHours: event.target.value })}
                className="h-9 text-xs"
                placeholder="40"
              />
            </div>
          </div>
          <section className="mt-5">
            <StepSectionHeader stepNumber={3} title="Data" variant="locked" />
            <LockedStepPreview previousStep={2} />
          </section>
        </section>
      )}

      {currentStep === 3 && (
        <section>
          <StepSectionHeader stepNumber={3} title="Data" variant="active" />
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Data Sources <RequiredMark />
              </Label>
              <Textarea
                value={form.dataSources}
                onChange={(event) => onChange({ dataSources: event.target.value })}
                className="min-h-[88px] text-xs"
                placeholder="ServiceNow tickets, SharePoint KB articles, Teams threads"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Data Sensitivity <RequiredMark />
                </Label>
                <Select
                  value={form.dataSensitivity || undefined}
                  onValueChange={(value) =>
                    onChange({ dataSensitivity: value as DataSensitivity })
                  }
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SENSITIVITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">
                  Data Access Status <RequiredMark />
                </Label>
                <Select
                  value={form.dataAccessStatus || undefined}
                  onValueChange={(value) =>
                    onChange({ dataAccessStatus: value as DataAccessStatus })
                  }
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue placeholder="Select access status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <section className="mt-5">
            <StepSectionHeader stepNumber={4} title="Readiness" variant="locked" />
            <LockedStepPreview previousStep={3} />
          </section>
        </section>
      )}

      {currentStep === 4 && (
        <section>
          <StepSectionHeader stepNumber={4} title="Readiness" variant="active" />
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">
                Skill Level Available <RequiredMark />
              </Label>
              <Select
                value={form.skillLevelAvailable || undefined}
                onValueChange={(value) =>
                  onChange({ skillLevelAvailable: value as SkillLevel })
                }
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-[11px] text-stone-700">
                Existing Tools <RequiredMark />
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SEED_TOOLS.map((tool) => (
                  <label key={tool.id} className="flex items-center gap-2 text-xs text-stone-700">
                    <Checkbox
                      checked={form.existingTools.includes(tool.name)}
                      onCheckedChange={(checked) =>
                        toggleExistingTool(tool.name, checked === true)
                      }
                    />
                    {tool.name}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <Label className="mb-1.5 text-[11px] text-stone-700">Other</Label>
                <Input
                  value={form.existingToolsOther}
                  onChange={(event) => onChange({ existingToolsOther: event.target.value })}
                  className="h-9 text-xs"
                  placeholder="Any other tools your team uses"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 text-[11px] text-stone-700">
                Integration Targets <RequiredMark />
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {INTEGRATION_TARGET_OPTIONS.map((target) => (
                  <label key={target} className="flex items-center gap-2 text-xs text-stone-700">
                    <Checkbox
                      checked={form.integrationTargets.includes(target)}
                      onCheckedChange={(checked) =>
                        toggleIntegration(target, checked === true)
                      }
                    />
                    {target}
                  </label>
                ))}
              </div>
              {form.integrationTargets.includes('Other') && (
                <div className="mt-2">
                  <Label className="mb-1.5 text-[11px] text-stone-700">Other integration</Label>
                  <Input
                    value={form.integrationOther}
                    onChange={(event) => onChange({ integrationOther: event.target.value })}
                    className="h-9 text-xs"
                    placeholder="Describe the system to integrate with"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
