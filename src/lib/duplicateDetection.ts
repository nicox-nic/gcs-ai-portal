import type { Project } from '@/types'

/** Jaccard similarity threshold for duplicate detection (tunable). */
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.25

/** Alternate gate: enough shared significant tokens also counts as a match. */
export const DUPLICATE_MIN_SHARED_TOKENS = 3

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'will',
  'been',
  'were',
  'they',
  'them',
  'their',
  'about',
  'into',
  'over',
  'under',
  'after',
  'before',
  'which',
  'where',
  'when',
  'what',
  'while',
  'would',
  'could',
  'should',
  'there',
  'these',
  'those',
  'using',
  'based',
  'across',
  'through',
  'between',
  'without',
  'within',
  'also',
  'than',
  'then',
  'only',
  'just',
  'more',
  'most',
  'some',
  'such',
  'each',
  'other',
  'into',
  'onto',
  'able',
  'make',
  'made',
  'need',
  'needs',
  'help',
  'team',
  'users',
  'user',
])

export type SimilarCandidate = {
  title: string
  problem: string
  goal: string
}

export type SimilarMatch = {
  project: Project
  score: number
  sharedTokens: string[]
}

export function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token))
  return new Set(tokens)
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const token of a) {
    if (b.has(token)) intersection += 1
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function sharedTokensOf(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = []
  for (const token of a) {
    if (b.has(token)) shared.push(token)
  }
  return shared.sort()
}

export function findSimilarProjects(
  candidate: SimilarCandidate,
  projects: Project[],
  opts?: {
    threshold?: number
    minSharedTokens?: number
    limit?: number
  },
): SimilarMatch[] {
  const threshold = opts?.threshold ?? DUPLICATE_SIMILARITY_THRESHOLD
  const minShared = opts?.minSharedTokens ?? DUPLICATE_MIN_SHARED_TOKENS
  const limit = opts?.limit ?? 3

  const candidateTokens = tokenize(
    `${candidate.title} ${candidate.problem} ${candidate.goal}`,
  )

  const matches: SimilarMatch[] = []
  for (const project of projects) {
    const corpus = tokenize(
      `${project.title} ${project.submission.problem} ${project.submission.goal}`,
    )
    const score = jaccardSimilarity(candidateTokens, corpus)
    const sharedTokens = sharedTokensOf(candidateTokens, corpus)
    if (score >= threshold || sharedTokens.length >= minShared) {
      matches.push({ project, score, sharedTokens })
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || b.sharedTokens.length - a.sharedTokens.length)
    .slice(0, limit)
}
