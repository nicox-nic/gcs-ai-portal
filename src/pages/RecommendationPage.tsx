import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  SlidersHorizontal,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomiseStackDialog } from '@/components/dialogs/CustomiseStackDialog'
import {
  AlternativeToolCard,
  ComboCard,
  getDisplayedCombos,
  RecommendationFooter,
  SelectedStackBar,
  SubmissionSummaryBar,
  ToolRankingCard,
} from '@/components/recommendations/RecommendationSections'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { comboMatchesStack } from '@/lib/toolStack'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'

export function RecommendationPage() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectsStore((state) =>
    id ? state.projects.find((item) => item.id === id) : undefined,
  )
  const applyCombo = useProjectsStore((state) => state.applyCombo)
  const updateToolStack = useProjectsStore((state) => state.updateToolStack)
  const tools = useCatalogStore((state) => state.tools)
  const trainings = useCatalogStore((state) => state.trainings)
  const combos = useCatalogStore((state) => state.combos)

  const [customiseOpen, setCustomiseOpen] = useState(false)

  const displayedCombos = useMemo(() => {
    if (!project) return []
    return getDisplayedCombos(project.submission, combos, project.recommendedComboIds)
  }, [project, combos])

  useEffect(() => {
    if (!project || project.toolStack.length > 0) return
    const firstComboId = project.recommendedComboIds[0] ?? displayedCombos[0]?.id
    if (!firstComboId) return
    try {
      applyCombo(project.id, firstComboId)
    } catch {
      // Combo may be missing from catalog after admin edits — user can select manually.
    }
  }, [project, displayedCombos, applyCombo])

  if (!id) {
    return <Navigate to="/projects" replace />
  }

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const handleStackChange = (stack: typeof project.toolStack) => {
    try {
      updateToolStack(project.id, stack)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update stack.')
    }
  }

  const handleSelectCombo = (comboId: string) => {
    try {
      applyCombo(project.id, comboId)
      toast.success('Stack updated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not apply combo.')
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
            Back to submission
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Tool Recommendations"
        subtitle={
          <span>
            Based on your submission for <strong>{project.title}</strong>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-900">
              <CircleCheck className="h-3 w-3" />
              Submitted for review
            </span>
            <Button asChild className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
              <Link to={`/projects/${project.id}`}>
                Continue to Project
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        }
        className="mb-4"
      />

      <SubmissionSummaryBar submission={project.submission} />

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-stone-900">
          <Layers className="h-4 w-4 text-indigo-600" />
          Recommended Tool Combos
          <span className="text-[10px] font-normal text-stone-500">
            — pre-built stacks that work well together for your use case
          </span>
        </div>
        {displayedCombos.length === 0 ? (
          <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
            No strong combo matches yet. Add more detail to your submission or customise your stack
            below.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {displayedCombos.map((combo, index) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                tools={tools}
                index={index}
                selected={comboMatchesStack(project.toolStack, combo)}
                onSelect={() => handleSelectCombo(combo.id)}
              />
            ))}
          </div>
        )}
      </section>

      <SelectedStackBar
        stack={project.toolStack}
        tools={tools}
        onCustomise={() => setCustomiseOpen(true)}
      />

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-stone-900">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Individual Tool Rankings
          <span className="text-[10px] font-normal text-stone-500">
            — toggle add-ons to customise your stack
          </span>
        </div>

        {project.recommendations.length === 0 ? (
          <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
            No strong individual matches yet. Try adding more detail to your submission.
          </div>
        ) : (
          <div className="mb-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {project.recommendations.map((recommendation) => {
              const tool = tools.find((item) => item.id === recommendation.toolId)
              if (!tool) return null
              return (
                <ToolRankingCard
                  key={recommendation.toolId}
                  recommendation={recommendation}
                  tool={tool}
                  trainings={trainings}
                  stack={project.toolStack}
                  onStackChange={handleStackChange}
                />
              )
            })}
          </div>
        )}

        {project.alternativeRecommendations.length > 0 && (
          <>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Alternatives — toggle to add to your stack
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {project.alternativeRecommendations.map((recommendation) => {
                const tool = tools.find((item) => item.id === recommendation.toolId)
                if (!tool) return null
                return (
                  <AlternativeToolCard
                    key={recommendation.toolId}
                    recommendation={recommendation}
                    tool={tool}
                    stack={project.toolStack}
                    onStackChange={handleStackChange}
                  />
                )
              })}
            </div>
          </>
        )}
      </section>

      <RecommendationFooter projectId={project.id} />

      <CustomiseStackDialog
        open={customiseOpen}
        onOpenChange={setCustomiseOpen}
        projectId={project.id}
        projectTitle={project.title}
        submission={project.submission}
        initialStack={project.toolStack}
      />
    </>
  )
}
