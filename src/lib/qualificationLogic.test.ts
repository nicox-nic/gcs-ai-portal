import { describe, expect, it } from 'vitest'
import { emptyQualification, emptyReadiness } from '@/lib/qualificationCriteria'
import {
  canQualify,
  qualifiesAsAI,
  scoreReadiness,
  suggestTier,
} from '@/lib/qualificationLogic'
import type { Submission } from '@/types'

function readinessWithCounts(f: number, v: number, d: number) {
  const base = emptyReadiness()
  return {
    feasibility: base.feasibility.map((_, i) => i < f),
    viability: base.viability.map((_, i) => i < v),
    desirability: base.desirability.map((_, i) => i < d),
  }
}

const baseSubmission: Submission = {
  useCase: 'Internal dashboard',
  problem: 'Reporting is slow',
  goal: 'Faster reports',
  targetUsers: 'Analysts',
  expectedOutcome: 'Faster cycle',
  dataSources: 'SharePoint',
  dataSensitivity: 'Public',
  dataAccessStatus: 'Available',
  skillLevelAvailable: 'Basic',
  existingTools: [],
  integrationTargets: [],
  estimatedUsers: 10,
  expectedBenefitHours: 5,
}

describe('qualificationLogic', () => {
  it('marks dimension Not Met below 4 and Met at 4+', () => {
    const notMet = scoreReadiness(readinessWithCounts(3, 3, 3))
    expect(notMet.feasibilityMet).toBe(false)
    expect(notMet.allMet).toBe(false)

    const met = scoreReadiness(readinessWithCounts(4, 4, 4))
    expect(met.feasibilityMet).toBe(true)
    expect(met.viabilityMet).toBe(true)
    expect(met.desirabilityMet).toBe(true)
    expect(met.allMet).toBe(true)
  })

  it('requires all three dimensions for allMet', () => {
    const partial = scoreReadiness(readinessWithCounts(7, 7, 3))
    expect(partial.allMet).toBe(false)
  })

  it('qualifiesAsAI when any Section A is true', () => {
    const none = emptyQualification()
    expect(qualifiesAsAI(none)).toBe(false)

    const one = emptyQualification()
    one.primary[2] = true
    expect(qualifiesAsAI(one)).toBe(true)
  })

  it('canQualify requires readiness + AI + reward (delivery tier not required)', () => {
    const readiness = readinessWithCounts(4, 4, 4)
    const qualification = emptyQualification()
    qualification.primary[0] = true
    qualification.riskTier = 'Medium'

    expect(canQualify(readiness, qualification, null)).toBe(false)
    expect(canQualify(readinessWithCounts(3, 4, 4), qualification, 'Kaizen')).toBe(false)
    expect(canQualify(readiness, emptyQualification(), 'Kaizen')).toBe(false)
    expect(canQualify(readiness, qualification, 'Kaizen')).toBe(true)
  })

  it('suggestTier nudges from sensitivity and scale', () => {
    expect(suggestTier({ ...baseSubmission, dataSensitivity: 'Public' })).toBe('Low')
    expect(suggestTier({ ...baseSubmission, dataSensitivity: 'Internal' })).toBe('Medium')
    expect(suggestTier({ ...baseSubmission, dataSensitivity: 'Confidential' })).toBe('High')
    expect(
      suggestTier({
        ...baseSubmission,
        dataSensitivity: 'Public',
        estimatedUsers: 120,
      }),
    ).toBe('Medium')
  })
})
