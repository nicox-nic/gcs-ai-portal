import type {
  Project,
  PmGateDecision,
  RequirementsArtifact,
  UatArtifact,
  User,
} from '@/types'
import { verificationPassed } from '@/lib/verification'
import { PM_GATE_REVIEWER_ROLES } from '@/lib/roles'

/** Tier2/Tier3 require BA sign-off before stage Complete; Tier1 is optional/self-attest. */
export function isBaGateMandatory(project: Project): boolean {
  return project.tier === 'Tier2' || project.tier === 'Tier3'
}

/** Gate 1 — PM Accept of requirements (Tier2 and Tier3). */
export function isPmRequirementsGateMandatory(project: Project): boolean {
  return project.tier === 'Tier2' || project.tier === 'Tier3'
}

/** Gate 2 — PM Accept after Development (Tier3 only). */
export function isPmDevelopmentGateMandatory(project: Project): boolean {
  return project.tier === 'Tier3'
}

export function emptyPmGate(): PmGateDecision {
  return { status: 'Pending', decidedBy: null, decidedAt: null, reason: '' }
}

export function pmRequirementsGateAccepted(project: Project): boolean {
  return project.pmRequirementsGate?.status === 'Accepted'
}

export function pmDevelopmentGateAccepted(project: Project): boolean {
  return project.pmDevelopmentGate?.status === 'Accepted'
}

export function canDecidePmGate(user: User | null): boolean {
  if (!user) return false
  return PM_GATE_REVIEWER_ROLES.includes(user.role)
}

export function requirementsComplete(project: Project): boolean {
  const artifact = project.requirements
  if (!artifact) return false
  return artifact.items.length >= 1 && artifact.confirmedBy !== null
}

export function uatPassed(project: Project): boolean {
  const artifact = project.uat
  if (!artifact) return false
  return artifact.outcome === 'Pass' && artifact.signedOffBy !== null
}

export function canEditRequirements(project: Project, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true
  return Boolean(project.businessAnalystId && user.id === project.businessAnalystId)
}

export function canEditUat(project: Project, user: User | null): boolean {
  return canEditRequirements(project, user)
}

export { canAssignBusinessAnalyst } from '@/lib/deliverySlots'

/**
 * Whether Development → Completed is allowed for this actor.
 * Tier1: always (self-attest optional). Tier2/3: needs confirmed requirements + PM Gate 1 Accept unless Admin.
 */
export function canCompleteDevelopment(project: Project, actor: User): boolean {
  if (actor.role === 'Admin') return true
  if (!isBaGateMandatory(project)) return true
  if (!requirementsComplete(project)) return false
  if (isPmRequirementsGateMandatory(project) && !pmRequirementsGateAccepted(project)) {
    return false
  }
  return true
}

/**
 * Whether Deployment → Completed is allowed for this actor.
 * Tier1: always. Tier2/3: needs BOTH passing UAT and DE verification unless Admin.
 */
export function canCompleteDeployment(project: Project, actor: User): boolean {
  if (actor.role === 'Admin') return true
  if (!isBaGateMandatory(project)) return true
  return uatPassed(project) && verificationPassed(project)
}

/** Tier3: Deployment may not start until PM Gate 2 is Accepted (Admin override). */
export function canEnterDeployment(project: Project, actor: User): boolean {
  if (actor.role === 'Admin') return true
  if (!isPmDevelopmentGateMandatory(project)) return true
  return pmDevelopmentGateAccepted(project)
}

export function developmentGateBlockReason(project: Project): string | null {
  if (!isBaGateMandatory(project)) return null
  if (!requirementsComplete(project)) {
    return 'Requirements must be confirmed by the assigned Business Analyst before Development can complete (Admin may override).'
  }
  if (isPmRequirementsGateMandatory(project) && !pmRequirementsGateAccepted(project)) {
    return 'PM must Accept requirements (Gate 1) before Development can complete (Admin may override).'
  }
  return null
}

export function deploymentEntryBlockReason(project: Project): string | null {
  if (!isPmDevelopmentGateMandatory(project)) return null
  if (pmDevelopmentGateAccepted(project)) return null
  return 'PM must Accept Gate 2 (post-Development) before Deployment can begin (Admin may override).'
}

export function deploymentGateBlockReason(project: Project): string | null {
  if (!isBaGateMandatory(project)) return null
  const uatOk = uatPassed(project)
  const verOk = verificationPassed(project)
  if (uatOk && verOk) return null

  const parts: string[] = []
  if (!uatOk) {
    if (project.uat?.outcome === 'Fail') {
      parts.push(
        'UAT is Fail — remediate with Data Engineering, then re-run UAT and sign off',
      )
    } else {
      parts.push('BA UAT must Pass and be signed off')
    }
  }
  if (!verOk) {
    if (project.verification?.outcome === 'Fail') {
      parts.push(
        'DE verification is Fail — remediate checks, then re-sign off verification',
      )
    } else {
      parts.push('DE tool & model verification must Pass and be signed off')
    }
  }
  return `${parts.join('; ')} before Deployment can complete (Admin may override).`
}

export function emptyRequirements(): RequirementsArtifact {
  return { items: [], notes: '', confirmedBy: null, confirmedAt: null }
}

export function emptyUat(): UatArtifact {
  return { cases: [], outcome: 'Pending', notes: '', signedOffBy: null, signedOffAt: null }
}

export function requirementsCiLabel(project: Project): string {
  if (!project.requirements) return '—'
  if (requirementsComplete(project)) return 'Confirmed'
  return 'Pending'
}

export function uatCiLabel(project: Project): string {
  if (!project.uat) return '—'
  if (uatPassed(project)) return 'Pass'
  if (project.uat.outcome === 'Fail') return 'Fail'
  return 'Pending'
}
