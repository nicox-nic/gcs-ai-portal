import type { Project, User, VerificationArtifact, VerificationCheck } from '@/types'

/** Same Tier2/3 rule as BA gates (`isBaGateMandatory`). */
export function isVerificationMandatory(project: Project): boolean {
  return project.tier === 'Tier2' || project.tier === 'Tier3'
}

export function verificationPassed(project: Project): boolean {
  const artifact = project.verification
  if (!artifact) return false
  return artifact.outcome === 'Pass' && artifact.verifiedBy !== null
}

/**
 * Assigned DE or Admin may edit.
 * If no DE assigned, any DataEngineering user may act (delivery-slot fallback).
 */
export function canEditVerification(project: Project, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true
  if (project.dataEngineerId) {
    return user.id === project.dataEngineerId
  }
  return user.role === 'DataEngineering'
}

export function defaultVerificationChecks(): VerificationCheck[] {
  return [
    {
      id: 'chk-config',
      description: 'Tool/model configured and access provisioned',
      result: 'Untested',
    },
    {
      id: 'chk-output',
      description: 'Model output validated against acceptance criteria',
      result: 'Untested',
    },
    {
      id: 'chk-controls',
      description: 'Controls implemented (per risk tier)',
      result: 'Untested',
    },
    {
      id: 'chk-prod',
      description: 'Production readiness confirmed',
      result: 'Untested',
    },
  ]
}

export function emptyVerification(): VerificationArtifact {
  return {
    checks: defaultVerificationChecks(),
    outcome: 'Pending',
    notes: '',
    verifiedBy: null,
    verifiedAt: null,
  }
}

/** Derive outcome from checks: any Fail → Fail; all Pass → Pass; else Pending. */
export function outcomeFromChecks(
  checks: VerificationCheck[],
): 'Pass' | 'Fail' | 'Pending' {
  if (checks.length < 1) return 'Pending'
  if (checks.some((c) => c.result === 'Fail')) return 'Fail'
  if (checks.every((c) => c.result === 'Pass')) return 'Pass'
  return 'Pending'
}

export function verificationCiLabel(project: Project): string {
  if (!project.verification) return '—'
  if (verificationPassed(project)) return 'Pass'
  if (project.verification.outcome === 'Fail') return 'Fail'
  return 'Pending'
}
