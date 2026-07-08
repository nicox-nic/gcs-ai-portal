import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { findSimilarProjects, type SimilarMatch } from '@/lib/duplicateDetection'
import { buildSubmission, EMPTY_WIZARD_FORM, type WizardFormState } from '@/lib/submissionWizard'
import {
  deterministicUseCaseGenerator,
  type GeneratedUseCase,
} from '@/lib/useCaseGenerator'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { getProfileDefaults } from '@/stores/profileStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { DataAccessStatus, DataSensitivity, Group, Role, Site, SkillLevel } from '@/types'

const SUBMIT_ROLES: Role[] = ['Submitter', 'BusinessAnalyst', 'Admin']

type AssistedStep = 'questions' | 'duplicates' | 'preview'

type GuidedAnswers = {
  what: string
  why: string
  how: string
  who: string
}

const EMPTY_ANSWERS: GuidedAnswers = { what: '', why: '', how: '', who: '' }

function generatedToWizardForm(
  generated: GeneratedUseCase,
  profile: ReturnType<typeof getProfileDefaults>,
  currentUser: { group: Group; site: Site; department: string },
): WizardFormState {
  return {
    ...EMPTY_WIZARD_FORM,
    title: generated.title,
    group: currentUser.group,
    site: currentUser.site,
    department: currentUser.department,
    targetUsers: generated.targetUsers,
    estimatedUsers: String(generated.estimatedUsers || ''),
    useCase: generated.useCase,
    problem: generated.problem,
    goal: generated.goal,
    expectedOutcome: generated.expectedOutcome,
    expectedBenefitHours: '10',
    dataSources: generated.dataSources,
    dataSensitivity: 'Internal' as DataSensitivity,
    dataAccessStatus: 'Unknown' as DataAccessStatus,
    skillLevelAvailable: (profile.skillLevelAvailable || 'Basic') as SkillLevel | '',
    existingTools: generated.existingTools.length
      ? generated.existingTools
      : profile.existingTools,
    existingToolsOther: '',
    integrationTargets: generated.integrationTargets.length
      ? generated.integrationTargets
      : profile.integrationTargets,
    integrationOther: '',
  }
}

export function AssistedIntakePage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const createProject = useProjectsStore((state) => state.createProject)
  const submitProject = useProjectsStore((state) => state.submitProject)

  const [step, setStep] = useState<AssistedStep>('questions')
  const [answers, setAnswers] = useState<GuidedAnswers>(EMPTY_ANSWERS)
  const [matches, setMatches] = useState<SimilarMatch[]>([])
  const [preview, setPreview] = useState<WizardFormState | null>(null)
  const [generating, setGenerating] = useState(false)

  const canSubmitRole = currentUser && SUBMIT_ROLES.includes(currentUser.role)
  const profileDefaults = useMemo(
    () => (currentUser ? getProfileDefaults(currentUser.id) : getProfileDefaults('')),
    [currentUser],
  )

  useEffect(() => {
    if (currentUser && !SUBMIT_ROLES.includes(currentUser.role)) {
      toast.error('Your role cannot submit new projects.')
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  if (!canSubmitRole || !currentUser) {
    return null
  }

  const patchAnswers = (patch: Partial<GuidedAnswers>) => {
    setAnswers((previous) => ({ ...previous, ...patch }))
  }

  const validateQuestions = (): string | null => {
    if (!answers.what.trim()) return 'Describe WHAT you want to build.'
    if (!answers.why.trim()) return 'Describe WHY this matters.'
    if (!answers.how.trim()) return 'Describe HOW / what data or systems are involved.'
    if (!answers.who.trim()) return 'Describe WHO will use it (include an approximate headcount).'
    return null
  }

  const runDuplicateCheck = () => {
    const error = validateQuestions()
    if (error) {
      toast.error(error)
      return
    }
    const found = findSimilarProjects(
      {
        title: answers.what,
        problem: answers.why,
        goal: answers.what,
      },
      projects,
    )
    setMatches(found)
    if (found.length > 0) {
      setStep('duplicates')
      return
    }
    void generatePreview()
  }

  const generatePreview = async () => {
    setGenerating(true)
    try {
      const generated = await deterministicUseCaseGenerator.generate({
        ...answers,
        profileDefaults,
      })
      setPreview(
        generatedToWizardForm(generated, profileDefaults, {
          group: currentUser.group,
          site: currentUser.site,
          department: currentUser.department,
        }),
      )
      setStep('preview')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not generate use case.')
    } finally {
      setGenerating(false)
    }
  }

  const patchPreview = (patch: Partial<WizardFormState>) => {
    setPreview((previous) => (previous ? { ...previous, ...patch } : previous))
  }

  const finish = (mode: 'draft' | 'submit') => {
    if (!preview) return

    if (!preview.title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (!preview.estimatedUsers.trim() || Number(preview.estimatedUsers) <= 0) {
      toast.error('Estimated users must be a positive number.')
      return
    }

    try {
      const submission = buildSubmission(preview)
      const project = createProject({
        title: preview.title.trim(),
        submitterId: currentUser.id,
        group: preview.group as Group,
        site: preview.site as Site,
        department: preview.department.trim() || currentUser.department,
        submission,
        intakeMode: 'assisted',
      })

      if (mode === 'submit') {
        submitProject(project.id)
        toast.success('Submitted for assessment.')
        navigate(`/projects/${project.id}`)
        return
      }

      toast.success('Draft saved to My Entries.')
      navigate('/profile')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save project.')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button
          asChild
          variant="ghost"
          className="h-auto px-0 text-xs text-stone-600 hover:bg-transparent hover:text-stone-900"
        >
          <Link to="/submit">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to intake options
          </Link>
        </Button>
      </div>

      <PageHeader
        title="AI-assisted use-case builder"
        subtitle="Answer four prompts, check for similar projects, then review a generated draft you can edit."
        className="mb-5"
      />

      <div className="mb-4 flex gap-2 text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {(['questions', 'duplicates', 'preview'] as AssistedStep[]).map((item) => (
          <span
            key={item}
            className={cn(
              'rounded-sm px-2 py-0.5',
              step === item ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-600',
            )}
          >
            {item}
          </span>
        ))}
      </div>

      {step === 'questions' && (
        <div className="max-w-2xl space-y-4 rounded-lg border-[0.5px] border-stone-200 bg-white p-5">
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">WHAT — what do you want to build?</Label>
            <Textarea
              value={answers.what}
              onChange={(event) => patchAnswers({ what: event.target.value })}
              className="min-h-20 text-xs"
              placeholder="e.g. A conversational triage agent for field engineers"
            />
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">WHY — what problem does it solve?</Label>
            <Textarea
              value={answers.why}
              onChange={(event) => patchAnswers({ why: event.target.value })}
              className="min-h-20 text-xs"
              placeholder="e.g. Engineers spend 30–40% of their shift triaging tickets before repair work"
            />
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">
              HOW — data sources / systems involved?
            </Label>
            <Textarea
              value={answers.how}
              onChange={(event) => patchAnswers({ how: event.target.value })}
              className="min-h-20 text-xs"
              placeholder="e.g. ServiceNow tickets, SharePoint KB, Teams threads"
            />
            {profileDefaults.existingTools.length > 0 && (
              <p className="mt-1 text-[10px] text-stone-500">
                Profile tools will pre-fill: {profileDefaults.existingTools.join(', ')}
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-stone-700">
              WHO — who will use it? (include approximate headcount)
            </Label>
            <Textarea
              value={answers.who}
              onChange={(event) => patchAnswers({ who: event.target.value })}
              className="min-h-16 text-xs"
              placeholder="e.g. ~120 field service engineers and dispatch coordinators"
            />
          </div>
          <div className="flex justify-end border-t-[0.5px] border-stone-200 pt-4">
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={runDuplicateCheck}
              disabled={generating}
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 'duplicates' && (
        <div className="max-w-2xl space-y-4 rounded-lg border-[0.5px] border-amber-200 bg-amber-50/40 p-5">
          <div>
            <h3 className="text-sm font-medium text-stone-900">Similar projects found</h3>
            <p className="mt-1 text-xs text-stone-600">
              These look related to your answers. Review them before generating a new use case.
            </p>
          </div>
          <div className="space-y-2">
            {matches.map((match) => (
              <div
                key={match.project.id}
                className="rounded-md border-[0.5px] border-stone-200 bg-white px-3.5 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${match.project.id}`}
                      className="text-xs font-medium text-indigo-700 hover:underline"
                    >
                      {match.project.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {match.project.id} · {getUserDisplayName(match.project.submitterId)} ·{' '}
                      {Math.round(match.score * 100)}% similar
                    </p>
                  </div>
                  <StatusBadge kind="project" status={match.project.status} />
                </div>
                <p className="mt-2 text-[11px] text-stone-600">
                  Shared terms: {match.sharedTokens.slice(0, 8).join(', ') || 'title overlap'}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t-[0.5px] border-amber-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setStep('questions')}
            >
              Edit my answers
            </Button>
            <Button
              type="button"
              className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
              onClick={() => void generatePreview()}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Proceed anyway →'}
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="max-w-2xl space-y-4 rounded-lg border-[0.5px] border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-stone-900">Generated use case</h3>
              <p className="text-[11px] text-stone-500">Edit any field before saving or submitting.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => void generatePreview()}
              disabled={generating}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Title</Label>
              <Input
                value={preview.title}
                onChange={(event) => patchPreview({ title: event.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Use case</Label>
              <Textarea
                value={preview.useCase}
                onChange={(event) => patchPreview({ useCase: event.target.value })}
                className="min-h-16 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Problem</Label>
              <Textarea
                value={preview.problem}
                onChange={(event) => patchPreview({ problem: event.target.value })}
                className="min-h-16 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Goal</Label>
              <Textarea
                value={preview.goal}
                onChange={(event) => patchPreview({ goal: event.target.value })}
                className="min-h-16 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Expected outcome</Label>
              <Textarea
                value={preview.expectedOutcome}
                onChange={(event) => patchPreview({ expectedOutcome: event.target.value })}
                className="min-h-16 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-stone-700">Data sources</Label>
              <Textarea
                value={preview.dataSources}
                onChange={(event) => patchPreview({ dataSources: event.target.value })}
                className="min-h-14 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">Target users</Label>
                <Input
                  value={preview.targetUsers}
                  onChange={(event) => patchPreview({ targetUsers: event.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] text-stone-700">Estimated users</Label>
                <Input
                  type="number"
                  min={1}
                  value={preview.estimatedUsers}
                  onChange={(event) => patchPreview({ estimatedUsers: event.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t-[0.5px] border-stone-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setStep(matches.length > 0 ? 'duplicates' : 'questions')}
            >
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => finish('draft')}
              >
                Save as draft
              </Button>
              <Button
                type="button"
                className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700"
                onClick={() => finish('submit')}
              >
                Submit for assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
