import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdvanceStageDialog } from '@/components/dialogs/AdvanceStageDialog'
import { CustomiseStackDialog } from '@/components/dialogs/CustomiseStackDialog'
import { ProjectHeaderCard } from '@/components/project/ProjectHeaderCard'
import {
  ProjectAuditLogTab,
  ProjectBenefitsTab,
  ProjectLifecycleTab,
  ProjectOverviewTab,
  ProjectRecommendationsTab,
} from '@/components/project/ProjectDetailTabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { StageTransitionOption } from '@/lib/lifecycle'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { cn } from '@/lib/utils'

function showBenefitsTab(project: {
  status: string
  currentStage: string
}): boolean {
  return (
    project.status === 'Completed' ||
    project.currentStage === 'Use' ||
    project.currentStage === 'Improvement' ||
    project.currentStage === 'Decommissioning'
  )
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((state) => state.currentUser)
  const project = useProjectsStore((state) =>
    id ? state.projects.find((item) => item.id === id) : undefined,
  )
  const advanceStage = useProjectsStore((state) => state.advanceStage)
  const applyCombo = useProjectsStore((state) => state.applyCombo)
  const reportBenefits = useProjectsStore((state) => state.reportBenefits)
  const validateBenefits = useProjectsStore((state) => state.validateBenefits)
  const tools = useCatalogStore((state) => state.tools)
  const combos = useCatalogStore((state) => state.combos)
  const trainings = useCatalogStore((state) => state.trainings)

  const [activeTab, setActiveTab] = useState('overview')
  const [customiseOpen, setCustomiseOpen] = useState(false)
  const [pendingTransition, setPendingTransition] = useState<StageTransitionOption | null>(null)

  useEffect(() => {
    setActiveTab('overview')
  }, [id])

  if (!id) {
    return <Navigate to="/projects" replace />
  }

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const handleTransition = (note: string) => {
    if (!pendingTransition || !currentUser) return
    try {
      advanceStage(
        project.id,
        pendingTransition.toStage,
        pendingTransition.toStatus,
        currentUser,
        note || pendingTransition.label,
      )
      toast.success('Stage updated.')
      setPendingTransition(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update stage.')
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
          <Link to="/projects">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <PageHeader title="Project Detail" className="mb-4" />

      <ProjectHeaderCard
        project={project}
        tools={tools}
        onCustomiseStack={() => setCustomiseOpen(true)}
      />

      <div className="overflow-hidden rounded-lg border-[0.5px] border-stone-200 bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-stone-200 bg-stone-100 p-0">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'lifecycle', label: 'Lifecycle' },
              { id: 'recommendations', label: 'Recommendations' },
              { id: 'benefits', label: 'Benefits & Closure', hidden: !showBenefitsTab(project) },
              {
                id: 'audit',
                label: 'Audit Log',
                badge: project.auditLog.length,
              },
            ]
              .filter((tab) => !tab.hidden)
              .map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-xs data-[state=active]:border-indigo-600 data-[state=active]:bg-white data-[state=active]:text-stone-900',
                  )}
                >
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="ml-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-900">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
          </TabsList>

          <TabsContent value="overview" className="m-0">
            <ProjectOverviewTab
              project={project}
              tools={tools}
              trainings={trainings}
              currentUser={currentUser}
              onTabChange={setActiveTab}
              onRequestTransition={setPendingTransition}
            />
          </TabsContent>

          <TabsContent value="lifecycle" className="m-0">
            <ProjectLifecycleTab
              project={project}
              currentUser={currentUser}
              onRequestTransition={setPendingTransition}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="m-0">
            <ProjectRecommendationsTab
              project={project}
              tools={tools}
              combos={combos}
              onCustomiseStack={() => setCustomiseOpen(true)}
              onApplyCombo={(comboId) => {
                try {
                  applyCombo(project.id, comboId)
                  toast.success('Stack updated.')
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Could not apply combo.')
                }
              }}
            />
          </TabsContent>

          {showBenefitsTab(project) && (
            <TabsContent value="benefits" className="m-0">
              <ProjectBenefitsTab
                project={project}
                currentUser={currentUser}
                onReportBenefits={(hours) => {
                  try {
                    reportBenefits(project.id, hours)
                    toast.success('Benefits submitted for sponsor validation.')
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Could not report benefits.')
                  }
                }}
                onValidateBenefits={() => {
                  try {
                    validateBenefits(project.id)
                    toast.success('Benefits validated.')
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Could not validate benefits.')
                  }
                }}
              />
            </TabsContent>
          )}

          <TabsContent value="audit" className="m-0">
            <ProjectAuditLogTab project={project} />
          </TabsContent>
        </Tabs>
      </div>

      <AdvanceStageDialog
        open={pendingTransition !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null)
        }}
        transition={pendingTransition}
        onConfirm={handleTransition}
      />

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
