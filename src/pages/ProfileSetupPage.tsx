import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
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
import { INTEGRATION_TARGET_OPTIONS } from '@/lib/submissionWizard'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProfileStore } from '@/stores/profileStore'
import { useUiStore } from '@/stores/uiStore'
import type { SkillLevel } from '@/types'

const SKILL_OPTIONS: SkillLevel[] = ['None', 'Basic', 'Intermediate', 'Advanced']

type LocationState = {
  from?: string
}

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAuthStore((state) => state.currentUser)
  const tools = useCatalogStore((state) => state.tools)
  const existing = useProfileStore((state) =>
    currentUser ? state.getProfile(currentUser.id) : undefined,
  )
  const saveProfile = useProfileStore((state) => state.saveProfile)
  const skipProfileSetup = useUiStore((state) => state.skipProfileSetup)

  const catalogNames = useMemo(() => tools.map((tool) => tool.name), [tools])

  const initialOtherTools = useMemo(() => {
    if (!existing) return ''
    return existing.toolChain.filter((name) => !catalogNames.includes(name)).join(', ')
  }, [existing, catalogNames])

  const [skillLevel, setSkillLevel] = useState<SkillLevel | ''>(existing?.skillLevel ?? '')
  const [toolChain, setToolChain] = useState<string[]>(
    () => existing?.toolChain.filter((name) => catalogNames.includes(name)) ?? [],
  )
  const [toolOther, setToolOther] = useState(initialOtherTools)
  const [integrationTargets, setIntegrationTargets] = useState<string[]>(
    existing?.integrationTargets ?? [],
  )

  if (!currentUser) {
    return null
  }

  const from =
    (location.state as LocationState | null)?.from &&
    (location.state as LocationState).from !== '/profile/setup'
      ? (location.state as LocationState).from!
      : '/profile'

  const toggleTool = (name: string, checked: boolean) => {
    setToolChain((previous) =>
      checked ? [...previous, name] : previous.filter((item) => item !== name),
    )
  }

  const toggleIntegration = (target: string, checked: boolean) => {
    setIntegrationTargets((previous) =>
      checked ? [...previous, target] : previous.filter((item) => item !== target),
    )
  }

  const handleSave = () => {
    if (!skillLevel) {
      toast.error('Select a skill level.')
      return
    }

    const otherTools = toolOther
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const mergedTools = [...toolChain]
    for (const name of otherTools) {
      if (!mergedTools.includes(name)) mergedTools.push(name)
    }

    if (mergedTools.length === 0) {
      toast.error('Select at least one tool in your chain (or add Other).')
      return
    }
    if (integrationTargets.length === 0) {
      toast.error('Select at least one integration target.')
      return
    }

    saveProfile(currentUser.id, {
      skillLevel,
      toolChain: mergedTools,
      integrationTargets,
    })
    toast.success('Profile saved. New submissions will use these defaults.')
    navigate(from, { replace: true })
  }

  const handleSkip = () => {
    skipProfileSetup()
    toast.message('Profile setup skipped for this session.')
    navigate(from === '/profile' ? '/dashboard' : from, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Set up your profile"
        subtitle="Tell us your skill level and tool chain so new project submissions can be pre-filled."
        className="mb-5"
      />

      <div className="mb-4 rounded-md border-[0.5px] border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-indigo-900">
        <span className="font-medium">Mock M365 note:</span> your Microsoft 365 account is{' '}
        <em>pending IT approval</em>. You can set up your portal profile meanwhile — this is demo
        copy only; no real Entra / M365 check runs.
      </div>

      <div className="max-w-2xl rounded-lg border-[0.5px] border-stone-200 bg-white p-5">
        <div className="space-y-5">
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">Skill level</Label>
            <Select
              value={skillLevel || undefined}
              onValueChange={(value) => setSkillLevel(value as SkillLevel)}
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
            <Label className="mb-2 text-[11px] text-stone-700">Existing tool chain</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tools.map((tool) => (
                <label key={tool.id} className="flex items-center gap-2 text-xs text-stone-700">
                  <Checkbox
                    checked={toolChain.includes(tool.name)}
                    onCheckedChange={(checked) => toggleTool(tool.name, checked === true)}
                  />
                  {tool.name}
                </label>
              ))}
            </div>
            <div className="mt-2">
              <Label className="mb-1.5 text-[11px] text-stone-700">Other</Label>
              <Input
                value={toolOther}
                onChange={(event) => setToolOther(event.target.value)}
                className="h-9 text-xs"
                placeholder="Comma-separated tools not in the catalog"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 text-[11px] text-stone-700">Integration targets</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INTEGRATION_TARGET_OPTIONS.map((target) => (
                <label key={target} className="flex items-center gap-2 text-xs text-stone-700">
                  <Checkbox
                    checked={integrationTargets.includes(target)}
                    onCheckedChange={(checked) => toggleIntegration(target, checked === true)}
                  />
                  {target}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t-[0.5px] border-stone-200 pt-4">
          <Button type="button" variant="ghost" className="h-8 text-xs" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button
            type="button"
            className="h-8 bg-indigo-600 px-3.5 text-xs hover:bg-indigo-700"
            onClick={handleSave}
          >
            Save profile
          </Button>
        </div>
      </div>
    </>
  )
}
