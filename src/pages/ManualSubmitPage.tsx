import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SubmissionWizardSidebar } from '@/components/submission/SubmissionWizardSidebar'
import { WizardFormFields } from '@/components/submission/WizardFormFields'
import { WizardStepper } from '@/components/submission/WizardStepper'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { recommendCombos, recommendTools } from '@/lib/recommendationEngine'
import {
  EMPTY_WIZARD_FORM,
  WIZARD_STEPS,
  buildSubmission,
  getWizardChecklist,
  validateWizardStep,
  type WizardFormState,
} from '@/lib/submissionWizard'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { getProfileDefaults } from '@/stores/profileStore'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Group, Role, Site } from '@/types'

const SUBMIT_ROLES: Role[] = ['Submitter', 'BusinessAnalyst', 'Admin']

export function ManualSubmitPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const createProject = useProjectsStore((state) => state.createProject)
  const updateProject = useProjectsStore((state) => state.updateProject)
  const setRecommendations = useProjectsStore((state) => state.setRecommendations)
  const submitProject = useProjectsStore((state) => state.submitProject)
  const tools = useCatalogStore((state) => state.tools)
  const trainings = useCatalogStore((state) => state.trainings)
  const combos = useCatalogStore((state) => state.combos)

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<WizardFormState>(() => ({
    ...EMPTY_WIZARD_FORM,
    ...(currentUser ? getProfileDefaults(currentUser.id) : {}),
  }))
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null)

  const checklist = useMemo(() => getWizardChecklist(form), [form])
  const canSubmitRole = currentUser && SUBMIT_ROLES.includes(currentUser.role)

  useEffect(() => {
    if (currentUser && !SUBMIT_ROLES.includes(currentUser.role)) {
      toast.error('Your role cannot submit new projects.')
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const patchForm = (patch: Partial<WizardFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }))
  }

  const persistDraft = (): string => {
    if (!currentUser) {
      throw new Error('You must be logged in to save a draft.')
    }

    const submission = buildSubmission(form)

    if (draftProjectId) {
      updateProject(draftProjectId, {
        title: form.title.trim(),
        group: form.group as Group,
        site: form.site as Site,
        department: form.department.trim(),
        submission: {
          ...submission,
          targetUsers: form.targetUsers.trim(),
        },
      })
      return draftProjectId
    }

    const project = createProject({
      title: form.title.trim(),
      submitterId: currentUser.id,
      group: form.group as Group,
      site: form.site as Site,
      department: form.department.trim(),
      submission,
      intakeMode: 'manual',
    })
    setDraftProjectId(project.id)
    return project.id
  }

  const handleSaveDraft = () => {
    const error = validateWizardStep(1, form)
    if (error) {
      toast.error(error)
      return
    }

    try {
      persistDraft()
      toast.success('Draft saved.')
    } catch (draftError) {
      toast.error(draftError instanceof Error ? draftError.message : 'Could not save draft.')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1)
    }
  }

  const handleNext = () => {
    const error = validateWizardStep(currentStep, form)
    if (error) {
      toast.error(error)
      return
    }

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep((step) => step + 1)
      return
    }

    handleSubmit()
  }

  const handleSubmit = () => {
    if (!currentUser) return

    for (let step = 1; step <= WIZARD_STEPS.length; step += 1) {
      const error = validateWizardStep(step, form)
      if (error) {
        toast.error(error)
        setCurrentStep(step)
        return
      }
    }

    try {
      const projectId = persistDraft()
      const submission = buildSubmission(form)
      // TODO(V3 Phase 4): relocate tool selection to post-qualification
      const { top, alternatives } = recommendTools(submission, tools, trainings)
      const rankedCombos = recommendCombos(submission, combos, tools)
      const recommendedComboIds = rankedCombos
        .filter((combo) => combo.matchScore >= 30)
        .slice(0, 3)
        .map((combo) => combo.id)

      setRecommendations(projectId, top, alternatives, recommendedComboIds)
      submitProject(projectId)
      toast.success('Project submitted — recommendations are ready.')
      navigate(`/projects/${projectId}/recommendations`)
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Submission failed.')
    }
  }

  if (!canSubmitRole) {
    return null
  }

  const nextStepLabel =
    currentStep < WIZARD_STEPS.length ? WIZARD_STEPS[currentStep].label : null

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
        title="Submit New AI Project"
        subtitle="Complete all 4 steps to submit your AI initiative for review and tool recommendations."
        className="mb-5"
      />

      <div className="mb-5">
        <WizardStepper currentStep={currentStep} />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 rounded-lg border-[0.5px] border-stone-200 bg-white p-5">
          <WizardFormFields currentStep={currentStep} form={form} onChange={patchForm} />

          <div className="mt-4 flex items-center justify-between border-t-[0.5px] border-stone-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs disabled:opacity-50"
              disabled={currentStep === 1}
              onClick={handleBack}
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-xs"
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                className="h-8 bg-indigo-600 px-3.5 text-xs hover:bg-indigo-700"
                onClick={handleNext}
              >
                {currentStep === WIZARD_STEPS.length
                  ? 'Submit & See Recommendations'
                  : `Next: ${nextStepLabel} →`}
              </Button>
            </div>
          </div>
        </div>

        <SubmissionWizardSidebar checklist={checklist} />
      </div>
    </>
  )
}
