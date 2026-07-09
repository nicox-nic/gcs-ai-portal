import { SEED_USERS } from '@/data/seedRoles'
import { useNotificationsStore } from '@/stores/notificationsStore'
import type { NotificationKind, Project, Role, User } from '@/types'

function usersWithRoles(roles: Role[]): string[] {
  return SEED_USERS.filter((u) => roles.includes(u.role)).map((u) => u.id)
}

function unique(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))]
}

/** Prefer assigned lead; fall back to all users with that role. */
function assignedOrRole(assignedId: string | null | undefined, role: Role): string[] {
  if (assignedId) return [assignedId]
  return usersWithRoles([role])
}

export function recipientsFor(
  kind: NotificationKind,
  project: Project,
): { to: string[]; cc: string[] } {
  const submitter = project.submitterId
  const sponsor = project.sponsorId
  const ehs = project.ehsCoordinatorId
  const govRisk = usersWithRoles(['GovernanceLead', 'RiskCompliance'])
  const pmGov = unique([
    ...assignedOrRole(project.programManagerId, 'AIProgramManager'),
    ...usersWithRoles(['GovernanceLead']),
  ])
  const owners = unique([
    submitter,
    ...assignedOrRole(project.dataEngineerId, 'DataEngineering'),
    ...assignedOrRole(project.programManagerId, 'AIProgramManager'),
  ])
  const ms = assignedOrRole(project.maintenanceOwnerId, 'MaintenanceSustainability')
  const gov = usersWithRoles(['GovernanceLead'])
  const de = assignedOrRole(project.dataEngineerId, 'DataEngineering')
  const pm = assignedOrRole(project.programManagerId, 'AIProgramManager')

  switch (kind) {
    case 'submitted-for-assessment':
      return { to: govRisk, cc: unique([submitter]) }
    case 'qualified':
    case 'not-qualified':
      return { to: unique([submitter]), cc: gov }
    case 'submitted-for-review':
      return { to: pmGov, cc: unique([submitter]) }
    case 'approved':
    case 'rejected':
      return { to: owners, cc: gov }
    case 'ehs-review-requested':
      return {
        to: unique([ehs, ...usersWithRoles(['EHS'])]),
        cc: unique([submitter]),
      }
    case 'ehs-approved':
    case 'ehs-rejected':
      return { to: owners, cc: unique([ehs, ...usersWithRoles(['EHS'])]) }
    case 'sponsor-approval-requested':
      return {
        to: unique([sponsor, ...usersWithRoles(['Sponsor'])]),
        cc: unique([submitter]),
      }
    case 'completed':
    case 'disapproved':
      return { to: unique([...owners, sponsor]), cc: gov }
    case 'project-review-logged':
      return { to: owners, cc: gov }
    case 'aging-reminder':
    case 'aging-idle':
    case 'aging-alert':
    case 'aging-deactivated':
    case 'reactivated':
      return { to: unique([...owners, ...ms]), cc: gov }
    case 'requirements-requested':
    case 'uat-requested':
      return {
        to: unique([project.businessAnalystId]),
        cc: unique([...gov, ...pm]),
      }
    case 'requirements-confirmed':
      return {
        to: de,
        cc: unique([...gov, project.businessAnalystId]),
      }
    case 'uat-signed-off':
      return {
        to: unique([...pm, ...de]),
        cc: unique([...gov, project.businessAnalystId]),
      }
    case 'development-started':
      return { to: de, cc: unique([...gov, ...pm, project.businessAnalystId]) }
    case 'deployment-started':
      return { to: pm, cc: unique([...gov, ...de, project.businessAnalystId]) }
    case 'go-live':
      return { to: ms, cc: unique([...gov, ...owners]) }
    default:
      return { to: unique([submitter]), cc: gov }
  }
}

const SUBJECTS: Record<NotificationKind, (title: string) => string> = {
  'submitted-for-assessment': (t) => `[GCS AI] Submitted for assessment — ${t}`,
  qualified: (t) => `[GCS AI] Qualified — ${t}`,
  'not-qualified': (t) => `[GCS AI] Not qualified — ${t}`,
  'submitted-for-review': (t) => `[GCS AI] Tool stack submitted for review — ${t}`,
  approved: (t) => `[GCS AI] Submission approved — ${t}`,
  rejected: (t) => `[GCS AI] Submission rejected — ${t}`,
  'ehs-review-requested': (t) => `[GCS AI] EHS review requested — ${t}`,
  'ehs-approved': (t) => `[GCS AI] EHS approved — ${t}`,
  'ehs-rejected': (t) => `[GCS AI] EHS rejected — ${t}`,
  'sponsor-approval-requested': (t) => `[GCS AI] Sponsor approval requested — ${t}`,
  completed: (t) => `[GCS AI] Project completed — ${t}`,
  disapproved: (t) => `[GCS AI] Sponsor disapproved — ${t}`,
  'project-review-logged': (t) => `[GCS AI] Project review logged — ${t}`,
  'aging-reminder': (t) => `[GCS AI] Inactivity reminder — ${t}`,
  'aging-idle': (t) => `[GCS AI] Project marked Idle — ${t}`,
  'aging-alert': (t) => `[GCS AI] Long-idle alert — ${t}`,
  'aging-deactivated': (t) => `[GCS AI] Project deactivated — ${t}`,
  reactivated: (t) => `[GCS AI] Project reactivated — ${t}`,
  'requirements-requested': (t) => `[GCS AI] Requirements needed — ${t}`,
  'requirements-confirmed': (t) => `[GCS AI] Requirements confirmed — ${t}`,
  'uat-requested': (t) => `[GCS AI] UAT sign-off needed — ${t}`,
  'uat-signed-off': (t) => `[GCS AI] UAT signed off — ${t}`,
  'development-started': (t) => `[GCS AI] Development started — ${t}`,
  'deployment-started': (t) => `[GCS AI] Deployment started — ${t}`,
  'go-live': (t) => `[GCS AI] Project went live — ${t}`,
}

function defaultBody(kind: NotificationKind, project: Project, actor?: User | null): string {
  const who = actor ? `${actor.displayName} (${actor.role})` : 'System'
  return `Project "${project.title}" (${project.id}) — event: ${kind}. Triggered by ${who}. This is a mock email-style notification for the Phase 0 demo.`
}

/** Emit a mock email-style notification for a project event. */
export function notify(
  project: Project,
  kind: NotificationKind,
  actor?: User | null,
  bodyOverride?: string,
): void {
  const { to, cc } = recipientsFor(kind, project)
  if (to.length === 0 && cc.length === 0) return

  useNotificationsStore.getState().push({
    projectId: project.id,
    projectTitle: project.title,
    kind,
    to,
    cc,
    subject: SUBJECTS[kind](project.title),
    body: bodyOverride ?? defaultBody(kind, project, actor),
  })
}
