import type {
  Project,
  RequirementsArtifact,
  UatArtifact,
  User,
} from '@/types'
import { verificationPassed } from '@/lib/verification'

/** Tier2/Tier3 require BA sign-off before stage Complete; Tier1 is optional/self-attest. */
export function isBaGateMandatory(project: Project): boolean {
  return project.tier === 'Tier2' || project.tier === 'Tier3'
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
 * Tier1: always (self-attest optional). Tier2/3: needs confirmed requirements unless Admin.
 */
export function canCompleteDevelopment(project: Project, actor: User): boolean {
  if (actor.role === 'Admin') return true
  if (!isBaGateMandatory(project)) return true
  return requirementsComplete(project)
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

export function developmentGateBlockReason(project: Project): string | null {
  if (!isBaGateMandatory(project)) return null
  if (requirementsComplete(project)) return null
  return 'Requirements must be confirmed by the assigned Business Analyst before Development can complete (Admin may override).'
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
