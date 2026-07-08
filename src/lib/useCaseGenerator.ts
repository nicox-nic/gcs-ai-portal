/**
 * Deterministic mock. Swap in an LLM-backed `UseCaseGenerator` (Anthropic API)
 * later without touching callers.
 */

import type { SkillLevel } from '@/types'

export type ProfileDefaultsForGenerator = {
  skillLevelAvailable: SkillLevel | ''
  existingTools: string[]
  integrationTargets: string[]
}

export interface UseCaseInput {
  what: string
  why: string
  how: string
  who: string
  profileDefaults: ProfileDefaultsForGenerator
}

export interface GeneratedUseCase {
  title: string
  useCase: string
  problem: string
  goal: string
  expectedOutcome: string
  dataSources: string
  existingTools: string[]
  integrationTargets: string[]
  targetUsers: string
  estimatedUsers: number
}

export interface UseCaseGenerator {
  generate(input: UseCaseInput): Promise<GeneratedUseCase>
}

function deriveTitle(what: string): string {
  const cleaned = what.trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'Untitled AI initiative'
  const words = cleaned.split(' ').slice(0, 8)
  const title = words.join(' ')
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function parseEstimatedUsers(who: string): number {
  const match = who.match(/(\d[\d,]*)/)
  if (!match) return 25
  return Number(match[1].replace(/,/g, '')) || 25
}

function deriveTargetUsers(who: string): string {
  const withoutCount = who.replace(/\b\d[\d,]*\b/g, '').replace(/\s+/g, ' ').trim()
  return withoutCount || who.trim() || 'GCS team members'
}

export const deterministicUseCaseGenerator: UseCaseGenerator = {
  async generate(input) {
    const what = input.what.trim()
    const why = input.why.trim()
    const how = input.how.trim()
    const who = input.who.trim()
    const title = deriveTitle(what)

    return {
      title,
      useCase: what,
      problem: why,
      goal: `Deliver ${what.charAt(0).toLowerCase()}${what.slice(1)} to address: ${why}`,
      expectedOutcome: `Within 90 days, ${what.charAt(0).toLowerCase()}${what.slice(1)} measurably reduces the friction described: ${why}`,
      dataSources: how || 'To be confirmed with data owners',
      existingTools: [...input.profileDefaults.existingTools],
      integrationTargets: [...input.profileDefaults.integrationTargets],
      targetUsers: deriveTargetUsers(who),
      estimatedUsers: parseEstimatedUsers(who),
    }
  },
}
