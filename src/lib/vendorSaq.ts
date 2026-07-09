import type { Project, SaqAnswer, SaqArtifact, SaqOutcome, Tool, User } from '@/types'

/**
 * AI Supplier Self-Assessment Questionnaire (AI-SAQ).
 * Verbatim from AI_Checklists.xlsx → Vendor SAQ sheet.
 * Sections 1–8 = 31 scored questions; Section 9 = static declaration (not scored).
 */
export const SAQ_TITLE = 'AI Supplier Self-Assessment Questionnaire (AI-SAQ)'

/** Scored sections only (31 questions). Section 9 is SAQ_DECLARATION. */
export const SAQ_SECTIONS: { section: string; questions: string[] }[] = [
  {
    section: '1. Supplier & AI Service Overview',
    questions: [
      'Legal name of organization',
      'Primary business location(s)',
      'Description of AI or AI-enabled service(s) provided to Teradyne',
      'Intended use case(s) involving Teradyne data or systems',
      'AI lifecycle role (select all that apply; record choices in the note): Model development / Data processing / Model hosting / inference / System integration / Support / maintenance',
      'Will your AI service process or store Teradyne data? (If yes, identify data types in the note — e.g., personal, confidential, proprietary)',
    ],
  },
  {
    section: '2. Responsible AI & Ethics',
    questions: [
      'Do you maintain a documented AI ethics or Responsible AI policy?',
      'Have you implemented controls to mitigate bias, discrimination, or unethical outcomes in AI systems? (Briefly describe controls implemented in the note)',
      'Is human oversight in place for AI decision-making that may impact people, customers, or business operations? (Briefly explain oversight and escalation mechanisms in the note)',
      'Do you provide transparency regarding AI outputs, limitations, and intended use?',
    ],
  },
  {
    section: '3. Data Governance & Privacy',
    questions: [
      'Are all data sources used for training or operating the AI system documented and legally obtained?',
      'Do you restrict secondary use of Teradyne data or AI outputs without written authorization?',
      'Are data retention, deletion, and minimization controls formally defined?',
      'Is cross-border data transfer involved? (If yes, briefly describe safeguards in place in the note)',
    ],
  },
  {
    section: '4. Information Security Controls',
    questions: [
      'Do you maintain an information security management program? (If yes, list certifications — e.g., ISO 27001 — and validity in the note)',
      'Are data encryption controls implemented for data at rest and in transit?',
      'Are access controls based on least privilege and role-based principles?',
      'Do you conduct regular vulnerability assessments and remediation activities?',
    ],
  },
  {
    section: '5. AI Model & Technology Risk',
    questions: [
      'Who owns the AI model(s) provided to Teradyne? (Record in the note: Supplier / Teradyne / Shared / Licensed)',
      'Do you use third-party or open-source models/components? (If yes, briefly describe vetting and licensing approach in the note)',
      'Are model validation, testing, and performance monitoring processes established?',
      'Do you monitor for model drift, degradation, or unintended behavior?',
    ],
  },
  {
    section: '6. Legal, Contractual & Regulatory Compliance',
    questions: [
      'Do your AI services comply with applicable AI, privacy, and sector regulations?',
      'Do contracts include AI-specific clauses covering ethics, IP, data protection, audit rights, and termination?',
      'Are you willing to support Teradyne audits or assurance requests related to AI governance?',
    ],
  },
  {
    section: '7. Incident Management & Reporting',
    questions: [
      'Do you have a documented AI incident or breach response process?',
      'Are you contractually obligated to notify Teradyne of AI-related incidents or data breaches without undue delay?',
      'Do you perform root cause analysis and corrective actions following AI incidents?',
    ],
  },
  {
    section: '8. Ongoing Monitoring & Assurance',
    questions: [
      'Will you participate in periodic AI risk reassessments as requested by Teradyne?',
      'Can you provide independent audit reports or compliance attestations upon request?',
      'Will you cooperate with remediation or improvement actions if gaps are identified?',
    ],
  },
]

/** Section 9 — Supplier Declaration (not scored; not part of saqComplete). */
export const SAQ_DECLARATION = {
  section: '9. Supplier Declaration',
  certification:
    'I certify that the information provided in this AI Supplier Self-Assessment Questionnaire is accurate and complete to the best of my knowledge.',
  fields: ['Name', 'Title', 'Organization', 'Signature', 'Date'] as const,
}

const INTERNAL_VENDORS = new Set(
  ['teradyne', 'gcs', 'gcs internal', 'internal', 'in-house'].map((s) => s.toLowerCase()),
)

export function defaultSaqAnswers(): SaqAnswer[] {
  const answers: SaqAnswer[] = []
  let n = 1
  for (const block of SAQ_SECTIONS) {
    for (const question of block.questions) {
      answers.push({
        id: `saq-${String(n).padStart(2, '0')}`,
        section: block.section,
        question,
        response: null,
        note: '',
      })
      n += 1
    }
  }
  return answers
}

export function emptySaq(): SaqArtifact {
  return {
    answers: defaultSaqAnswers(),
    outcome: 'Pending',
    notes: '',
    completedBy: null,
    completedAt: null,
  }
}

/** True when the tool stack includes a non-internal vendor product. */
export function inferUsesExternalVendor(
  toolStack: Project['toolStack'],
  tools: Tool[],
): boolean {
  if (toolStack.length === 0) return false
  const byId = new Map(tools.map((t) => [t.id, t]))
  return toolStack.some((entry) => {
    const tool = byId.get(entry.toolId)
    if (!tool) return true
    return !INTERNAL_VENDORS.has(tool.vendor.trim().toLowerCase())
  })
}

export function isSaqRequired(project: Project): boolean {
  return project.usesExternalVendor === true
}

export function canEditSaq(project: Project, user: User | null): boolean {
  void project
  if (!user) return false
  return user.role === 'RiskCompliance' || user.role === 'Admin'
}

export function canSetUsesExternalVendor(user: User | null): boolean {
  if (!user) return false
  return (
    user.role === 'RiskCompliance' ||
    user.role === 'GovernanceLead' ||
    user.role === 'Admin'
  )
}

export function allSaqQuestionsAnswered(artifact: SaqArtifact | null | undefined): boolean {
  if (!artifact || artifact.answers.length < 1) return false
  return artifact.answers.every((a) => a.response === 'Yes' || a.response === 'No' || a.response === 'NA')
}

export function saqComplete(project: Project): boolean {
  const artifact = project.vendorSaq
  if (!artifact || artifact.completedBy === null) return false
  if (artifact.outcome !== 'Pass' && artifact.outcome !== 'Waived') return false
  return allSaqQuestionsAnswered(artifact)
}

export function canCompleteSupplierOversight(project: Project, actor: User): boolean {
  if (actor.role === 'Admin') return true
  if (!isSaqRequired(project)) return true
  return saqComplete(project)
}

export function supplierGateBlockReason(project: Project): string | null {
  if (!isSaqRequired(project)) return null
  if (saqComplete(project)) return null
  if (project.vendorSaq?.outcome === 'Fail' && project.vendorSaq.completedBy) {
    return 'Vendor AI-SAQ is Fail — remediate with the vendor, then re-complete as Pass or Waive with justification (Admin may override).'
  }
  return 'Vendor AI-SAQ must be completed (Pass or Waived) before Supplier Oversight can complete (Admin may override).'
}

export function saqCiLabel(project: Project): string {
  if (!project.usesExternalVendor) return 'N-A'
  if (!project.vendorSaq) return 'Pending'
  if (saqComplete(project)) {
    return project.vendorSaq.outcome === 'Waived' ? 'Waived' : 'Pass'
  }
  if (project.vendorSaq.outcome === 'Fail' && project.vendorSaq.completedBy) return 'Fail'
  return 'Pending'
}

export function groupAnswersBySection(answers: SaqAnswer[]): { section: string; answers: SaqAnswer[] }[] {
  const order: string[] = []
  const map = new Map<string, SaqAnswer[]>()
  for (const a of answers) {
    if (!map.has(a.section)) {
      order.push(a.section)
      map.set(a.section, [])
    }
    map.get(a.section)!.push(a)
  }
  return order.map((section) => ({ section, answers: map.get(section)! }))
}

export type { SaqOutcome }
