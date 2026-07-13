import { READINESS_MET_THRESHOLD } from '@/lib/qualificationCriteria'
import { TIER_BY_RISK } from '@/lib/projectStatus'
import type {
  ProjectTier,
  QualificationAssessment,
  ReadinessAssessment,
  RewardCategory,
  RiskLevel,
  Submission,
} from '@/types'

export type ReadinessScore = {
  feasibility: number
  viability: number
  desirability: number
  feasibilityMet: boolean
  viabilityMet: boolean
  desirabilityMet: boolean
  allMet: boolean
}

function countTrue(items: boolean[]): number {
  return items.filter(Boolean).length
}

export function scoreReadiness(r: ReadinessAssessment): ReadinessScore {
  const feasibility = countTrue(r.feasibility)
  const viability = countTrue(r.viability)
  const desirability = countTrue(r.desirability)
  const feasibilityMet = feasibility >= READINESS_MET_THRESHOLD
  const viabilityMet = viability >= READINESS_MET_THRESHOLD
  const desirabilityMet = desirability >= READINESS_MET_THRESHOLD
  return {
    feasibility,
    viability,
    desirability,
    feasibilityMet,
    viabilityMet,
    desirabilityMet,
    allMet: feasibilityMet && viabilityMet && desirabilityMet,
  }
}

export function qualifiesAsAI(q: QualificationAssessment): boolean {
  return q.primary.some(Boolean)
}

/** Hint only — Governance may override. Label as "suggested" in UI. */
export function suggestTier(submission: Submission): RiskLevel {
  let risk: RiskLevel = 'Low'
  if (submission.dataSensitivity === 'Restricted' || submission.dataSensitivity === 'Confidential') {
    risk = 'High'
  } else if (submission.dataSensitivity === 'Internal') {
    risk = 'Medium'
  }

  const text = `${submission.useCase} ${submission.problem} ${submission.goal} ${submission.targetUsers}`.toLowerCase()
  const customerFacing =
    /\b(customer|client|external|public[- ]facing|end[- ]user customer)\b/.test(text)

  if (customerFacing && risk !== 'High') {
    risk = risk === 'Low' ? 'Medium' : 'High'
  }

  if (submission.estimatedUsers >= 100 && risk === 'Low') {
    risk = 'Medium'
  }
  if (submission.estimatedUsers >= 250 && risk === 'Medium') {
    risk = 'High'
  }

  return risk
}

export function suggestProjectTier(submission: Submission): ProjectTier {
  return TIER_BY_RISK[suggestTier(submission)]
}

export function canQualify(
  readiness: ReadinessAssessment,
  qualification: QualificationAssessment,
  rewardCategory: RewardCategory | null,
): boolean {
  return (
    scoreReadiness(readiness).allMet &&
    qualifiesAsAI(qualification) &&
    rewardCategory !== null
  )
}
