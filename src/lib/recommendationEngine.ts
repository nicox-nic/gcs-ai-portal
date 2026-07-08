import type {
  DataSensitivity,
  Recommendation,
  SkillLevel,
  Submission,
  Tool,
  ToolCombo,
  Training,
} from '@/types'

const SKILL_RANK: Record<SkillLevel, number> = {
  None: 0,
  Basic: 1,
  Intermediate: 2,
  Advanced: 3,
}

const SENSITIVITY_RANK: Record<DataSensitivity, number> = {
  Public: 0,
  Internal: 1,
  Confidential: 2,
  Restricted: 3,
}

type KeywordRule = {
  pattern: RegExp
  toolIds: string[]
  delta: number
  label: string
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    pattern: /\b(chatbot|agent|q&a|conversation|answer|reply)\b/i,
    toolIds: ['tool-copilot-studio'],
    delta: 30,
    label: "Use case 'agent/Q&A' → +30",
  },
  {
    pattern: /\b(chatbot|agent|q&a)\b/i,
    toolIds: ['tool-m365-copilot'],
    delta: 20,
    label: "Use case 'agent' → +20",
  },
  {
    pattern: /\b(dashboard|report|visualize|kpi|metric|chart)\b/i,
    toolIds: ['tool-power-bi'],
    delta: 35,
    label: "Use case 'dashboard/report' → +35",
  },
  {
    pattern: /\b(automate|workflow|approval|routing|alert|notif)\b/i,
    toolIds: ['tool-power-automate'],
    delta: 30,
    label: "Use case 'automate/workflow' → +30",
  },
  {
    pattern: /\b(automate|workflow)\b/i,
    toolIds: ['tool-azure-logic-apps'],
    delta: 20,
    label: 'Enterprise automation → +20',
  },
  {
    pattern: /\b(predict|forecast|anomaly|model|trend)\b/i,
    toolIds: ['tool-azure-ml'],
    delta: 35,
    label: 'Predictive use case → +35',
  },
  {
    pattern: /\b(predict|forecast|anomaly|ml|model)\b/i,
    toolIds: ['tool-azure-ai-foundry'],
    delta: 25,
    label: 'ML platform use case → +25',
  },
  {
    pattern: /\b(form|app|intake|mobile|low.?code)\b/i,
    toolIds: ['tool-power-apps'],
    delta: 30,
    label: 'Form / app use case → +30',
  },
  {
    pattern: /\b(search|retriev|knowledge.?base|semantic)\b/i,
    toolIds: ['tool-azure-ai-search'],
    delta: 30,
    label: 'Search use case → +30',
  },
  {
    pattern: /\b(document|search|knowledge|sharepoint)\b/i,
    toolIds: ['tool-sharepoint'],
    delta: 20,
    label: 'Document / KB use case → +20',
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function submissionText(submission: Submission): string {
  return `${submission.useCase} ${submission.problem} ${submission.goal}`.toLowerCase()
}

function typicalUseCaseBonus(tool: Tool, text: string): { delta: number; label: string | null } {
  const firstUseCase = tool.typicalUseCases[0]
  if (!firstUseCase) return { delta: 0, label: null }

  const tokens = firstUseCase.toLowerCase().split(/[\s/]+/)
  for (const token of tokens) {
    if (token.length >= 4 && text.includes(token)) {
      return { delta: 25, label: 'Typical use case match → +25' }
    }
  }
  return { delta: 0, label: null }
}

function integrationBonus(tool: Tool, submission: Submission): { delta: number; labels: string[] } {
  const labels: string[] = []
  let delta = 0

  if (
    submission.integrationTargets.includes('SharePoint') &&
    tool.id === 'tool-sharepoint'
  ) {
    delta += 10
    labels.push('SharePoint integration target → +10')
  }
  if (
    submission.integrationTargets.includes('Teams') &&
    (tool.id === 'tool-copilot-studio' || tool.id === 'tool-m365-copilot')
  ) {
    delta += 5
    labels.push('Teams integration target → +5')
  }
  if (submission.integrationTargets.includes('Power BI') && tool.id === 'tool-power-bi') {
    delta += 5
    labels.push('Power BI integration target → +5')
  }

  return { delta, labels }
}

function buildRationale(tool: Tool, rulesFired: string[]): string {
  const primaryUseCase = tool.typicalUseCases[0]?.toLowerCase() ?? 'this use case'
  const topRules = rulesFired.filter((rule) => rule.includes('→ +')).slice(0, 2)
  const reason =
    topRules.length > 0
      ? topRules[0].split('→')[0].trim().replace(/^Use case /, 'The submission emphasises ')
      : 'The submission aligns with its typical use cases'
  return `${tool.name} is a strong fit for ${primaryUseCase}. ${reason}.`
}

function scoreTool(tool: Tool, submission: Submission): Recommendation {
  const text = submissionText(submission)
  let rawScore = 0
  const rulesFired: string[] = []
  const riskFlags: string[] = []

  for (const rule of KEYWORD_RULES) {
    if (!rule.toolIds.includes(tool.id)) continue
    if (rule.pattern.test(text)) {
      rawScore += rule.delta
      rulesFired.push(rule.label)
    }
  }

  const useCaseBonus = typicalUseCaseBonus(tool, text)
  if (useCaseBonus.delta > 0 && useCaseBonus.label) {
    rawScore += useCaseBonus.delta
    rulesFired.push(useCaseBonus.label)
  }

  const skillGap = SKILL_RANK[tool.requiredSkillLevel] - SKILL_RANK[submission.skillLevelAvailable]
  if (skillGap > 0) {
    const penalty = Math.min(skillGap * 10, 25)
    rawScore -= penalty
    rulesFired.push(`Skill gap (${skillGap} levels) → −${penalty}`)
    if (skillGap >= 2) {
      riskFlags.push(
        `Requires ${tool.requiredSkillLevel} skill — team is ${submission.skillLevelAvailable}`,
      )
    }
  }

  const sensitivityGap =
    SENSITIVITY_RANK[submission.dataSensitivity] - SENSITIVITY_RANK[tool.maxDataSensitivity]
  if (sensitivityGap > 0) {
    rawScore -= 40
    rulesFired.push('Data sensitivity exceeds tool max → −40')
    riskFlags.push(
      `Data sensitivity ${submission.dataSensitivity} exceeds tool max ${tool.maxDataSensitivity}`,
    )
  }

  if (submission.existingTools.includes(tool.name)) {
    rawScore += 10
    rulesFired.push('Existing tool in team → +10')
  }

  const integration = integrationBonus(tool, submission)
  if (integration.delta > 0) {
    rawScore += integration.delta
    rulesFired.push(...integration.labels)
  }

  const confidence = clamp(rawScore / 100, 0, 1)

  return {
    toolId: tool.id,
    rank: 0,
    confidence,
    rationale: buildRationale(tool, rulesFired),
    riskFlags,
    rulesFired,
  }
}

export function recommendTools(
  submission: Submission,
  tools: Tool[],
  _trainings: Training[],
): { top: Recommendation[]; alternatives: Recommendation[] } {
  void _trainings

  const scored = tools
    .map((tool) => scoreTool(tool, submission))
    .sort((a, b) => b.confidence - a.confidence || a.toolId.localeCompare(b.toolId))
    .map((rec, index) => ({ ...rec, rank: index + 1 }))

  return {
    top: scored.filter((rec) => rec.rank <= 3 && rec.confidence > 0.3),
    alternatives: scored.filter((rec) => rec.rank >= 4 && rec.rank <= 5),
  }
}

function comboMaxSensitivity(combo: ToolCombo, toolsById: Map<string, Tool>): DataSensitivity {
  const ranks = [combo.primaryToolId, ...combo.addOnToolIds].map(
    (toolId) => SENSITIVITY_RANK[toolsById.get(toolId)?.maxDataSensitivity ?? 'Public'],
  )
  const maxRank = Math.max(...ranks)
  return (Object.entries(SENSITIVITY_RANK).find(([, rank]) => rank === maxRank)?.[0] ??
    'Public') as DataSensitivity
}

export function recommendCombos(
  submission: Submission,
  combos: ToolCombo[],
  tools: Tool[],
): ToolCombo[] {
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]))
  const text = submissionText(submission)

  return combos
    .map((combo) => {
      let score = combo.matchScore
      const riskFlags = [...combo.riskFlags]

  let keywordBonus = 0
      for (const keyword of combo.bestForKeywords) {
        const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (pattern.test(text)) keywordBonus += 25
      }
      score += keywordBonus

      const skillGap =
        SKILL_RANK[combo.skillLevelRequired] - SKILL_RANK[submission.skillLevelAvailable]
      if (skillGap > 0) {
        score -= Math.min(skillGap * 8, 20)
      }

      const comboMax = comboMaxSensitivity(combo, toolsById)
      if (SENSITIVITY_RANK[submission.dataSensitivity] > SENSITIVITY_RANK[comboMax]) {
        score -= 35
        if (!riskFlags.some((flag) => flag.toLowerCase().includes('sensitivity'))) {
          riskFlags.push('Data sensitivity may exceed combo tool limits')
        }
      }

      const primaryName = toolsById.get(combo.primaryToolId)?.name
      if (primaryName && submission.existingTools.includes(primaryName)) {
        score += 8
      }

      return {
        ...combo,
        matchScore: clamp(score, 0, 100),
        riskFlags,
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
}
