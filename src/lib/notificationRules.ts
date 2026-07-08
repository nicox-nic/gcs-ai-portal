import { SEED_USERS } from '@/data/seedRoles'
import { useNotificationsStore } from '@/stores/notificationsStore'
import type { NotificationKind, Project, Role, User } from '@/types'

function usersWithRoles(roles: Role[]): string[] {
  return SEED_USERS.filter((u) => roles.includes(u.role)).map((u) => u.id)
}

function unique(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))]
}

export function recipientsFor(
  kind: NotificationKind,
  project: Project,
): { to: string[]; cc: string[] } {
  const submitter = project.submitterId
  const sponsor = project.sponsorId
  const ehs = project.ehsCoordinatorId
  const govRisk = usersWithRoles(['GovernanceLead', 'RiskCompliance'])
  const pmGov = usersWithRoles(['AIProgramManager', 'GovernanceLead'])
  const owners = unique([
    submitter,
    ...usersWithRoles(['DataEngineering', 'AIProgramManager']),
  ])
  const gov = usersWithRoles(['GovernanceLead'])

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
      return { to: owners, cc: unique([sponsor]) }
    case 'project-review-logged':
      return { to: owners, cc: gov }
    case 'aging-reminder':
    case 'aging-idle':
    case 'aging-alert':
    case 'aging-deactivated':
    case 'reactivated':
      return { to: owners, cc: gov }
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
