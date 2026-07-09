import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdvanceStageDialog } from '@/components/dialogs/AdvanceStageDialog'
import { CustomiseStackDialog } from '@/components/dialogs/CustomiseStackDialog'
import { ProjectHeaderCard } from '@/components/project/ProjectHeaderCard'
import {
  ProjectAuditLogTab,
  ProjectBenefitsTab,
  ProjectLifecycleTab,
  ProjectOverviewTab,
  ProjectToolSelectionTab,
} from '@/components/project/ProjectDetailTabs'
import {
  ProjectQualificationTab,
  showQualificationTab,
} from '@/components/project/ProjectQualificationTab'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { StageTransitionOption } from '@/lib/lifecycle'
import { canOwnStack } from '@/lib/tiering'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { cn } from '@/lib/utils'
import type { Project, User } from '@/types'

function showBenefitsTab(project: {
  status: string
  currentStage: string
}): boolean {
  return (
    project.status === 'Active' ||
    project.status === 'Completed' ||
    project.status === 'ForSponsorApproval' ||
    project.status === 'Disapproved' ||
    project.currentStage === 'Use' ||
    project.currentStage === 'Improvement' ||
    project.currentStage === 'Decommissioning'
  )
}

function canCustomiseStack(
  project: Project,
  currentUser: User | null,
): boolean {
  if (!currentUser) return false
  if (project.status !== 'Qualified' && project.status !== 'QualifiedDraft') return false
  return canOwnStack(project, currentUser)
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const project = useProjectsStore((state) =>
    id ? state.projects.find((item) => item.id === id) : undefined,
  )
  const advanceStage = useProjectsStore((state) => state.advanceStage)
  const applyCombo = useProjectsStore((state) => state.applyCombo)
  const reportBenefits = useProjectsStore((state) => state.reportBenefits)
  const qualifyProject = useProjectsStore((state) => state.qualifyProject)
  const rejectQualification = useProjectsStore((state) => state.rejectQualification)
  const resubmitForAssessment = useProjectsStore((state) => state.resubmitForAssessment)
  const cancelProject = useProjectsStore((state) => state.cancelProject)
  const assignBusinessAnalyst = useProjectsStore((state) => state.assignBusinessAnalyst)
  const tools = useCatalogStore((state) => state.tools)
  const combos = useCatalogStore((state) => state.combos)
  const trainings = useCatalogStore((state) => state.trainings)

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'tool-selection' || tabFromUrl === 'recommendations'
      ? 'tool-selection'
      : 'overview',
  )
  const [customiseOpen, setCustomiseOpen] = useState(false)
  const [pendingTransition, setPendingTransition] = useState<StageTransitionOption | null>(null)

  useEffect(() => {
    if (tabFromUrl === 'tool-selection' || tabFromUrl === 'recommendations') {
      setActiveTab('tool-selection')
      return
    }
    setActiveTab('overview')
  }, [id, tabFromUrl])

  if (!id) {
    return <Navigate to="/projects" replace />
  }

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const stackEditable = canCustomiseStack(project, currentUser)

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
        canCustomiseStack={stackEditable}
        currentUser={currentUser}
        onAssignBusinessAnalyst={(baUserId) => {
          if (!currentUser) return
          try {
            assignBusinessAnalyst(project.id, baUserId, currentUser)
            toast.success(
              baUserId ? 'Business Analyst assigned.' : 'Business Analyst cleared.',
            )
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Could not assign Business Analyst.',
            )
          }
        }}
      />

      <div className="overflow-hidden rounded-lg border-[0.5px] border-stone-200 bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-stone-200 bg-stone-100 p-0">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'lifecycle', label: 'Lifecycle' },
              {
                id: 'qualification',
                label: 'Qualification',
                hidden: !showQualificationTab(project.status),
              },
              { id: 'tool-selection', label: 'Tool Selection' },
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

          {showQualificationTab(project.status) && (
            <TabsContent value="qualification" className="m-0">
              <ProjectQualificationTab
                project={project}
                currentUser={currentUser}
                onQualify={(payload) => {
                  if (!currentUser) return
                  qualifyProject(project.id, payload, currentUser, '')
                }}
                onReject={(reason) => {
                  if (!currentUser) return
                  rejectQualification(project.id, reason, currentUser)
                }}
                onCancel={(reason) => {
                  if (!currentUser) return
                  cancelProject(project.id, reason, currentUser)
                }}
                onResubmit={() => {
                  if (!currentUser) return
                  resubmitForAssessment(project.id, currentUser)
                }}
              />
            </TabsContent>
          )}

          <TabsContent value="tool-selection" className="m-0">
            <ProjectToolSelectionTab
              project={project}
              tools={tools}
              combos={combos}
              trainings={trainings}
              currentUser={currentUser}
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
                    toast.success('Benefit hours saved.')
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : 'Could not report benefits.',
                    )
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
