import type { Project, SaqAnswer, SaqArtifact, SaqOutcome, Tool, User } from '@/types'

/**
 * Vendor AI-SAQ — 9 sections / 31 questions.
 * Exact wording should be confirmed against AI_Checklists.xlsx (Vendor SAQ sheet);
 * workbook is not in-repo, so this is a faithful ISO-42001-style stand-in.
 */
export const SAQ_SECTIONS: { section: string; questions: string[] }[] = [
  {
    section: '1. Company & Product Overview',
    questions: [
      'Vendor legal entity and primary AI product/service are clearly identified.',
      'Vendor provides a current description of the AI system’s intended use and limitations.',
      'Vendor confirms the product version / model family under assessment.',
    ],
  },
  {
    section: '2. AI System Description',
    questions: [
      'Vendor documents model type (e.g. generative, predictive, agentic) and core capabilities.',
      'Vendor discloses training / fine-tuning data categories at a high level.',
      'Vendor describes known failure modes and out-of-scope uses.',
      'Vendor provides architecture overview sufficient for Teradyne risk review.',
    ],
  },
  {
    section: '3. Data Governance & Privacy',
    questions: [
      'Vendor states whether customer data is used to train or improve shared models.',
      'Vendor supports data residency / processing-location commitments required by Teradyne.',
      'Vendor has a documented retention and deletion process for customer content.',
      'Vendor addresses personal data / PII handling consistent with applicable privacy law.',
    ],
  },
  {
    section: '4. Security & Access Control',
    questions: [
      'Vendor maintains SOC 2, ISO 27001, or equivalent security attestation (or equivalent controls).',
      'Vendor supports SSO / enterprise identity and least-privilege admin access.',
      'Vendor encrypts data in transit and at rest with industry-standard controls.',
      'Vendor provides vulnerability management and patch cadence for the AI service.',
    ],
  },
  {
    section: '5. Model Development & Validation',
    questions: [
      'Vendor describes evaluation / red-team practices before release.',
      'Vendor documents bias, fairness, or quality monitoring for material model updates.',
      'Vendor provides change-management notice for material model or API changes.',
      'Vendor supports customer-side validation / acceptance testing of outputs.',
    ],
  },
  {
    section: '6. Human Oversight & Transparency',
    questions: [
      'Vendor enables human-in-the-loop or human-on-the-loop controls where required.',
      'Vendor discloses AI-generated content or decisions to end users when appropriate.',
      'Vendor provides explainability / audit artifacts sufficient for Teradyne oversight.',
    ],
  },
  {
    section: '7. Incident Response & Continuity',
    questions: [
      'Vendor has a documented security / AI-incident response process with customer notification SLAs.',
      'Vendor provides status / availability commitments suitable for production use.',
      'Vendor supports export or exit of customer data if the engagement ends.',
    ],
  },
  {
    section: '8. Subprocessors & Third Parties',
    questions: [
      'Vendor maintains a current subprocessors list for AI-related processing.',
      'Vendor flows down equivalent security and privacy obligations to subprocessors.',
      'Vendor notifies customers of material subprocessor changes per contract.',
    ],
  },
  {
    section: '9. Contractual & Compliance Attestations',
    questions: [
      'NDA / MSA / DPA (as applicable) are executed or in progress with Teradyne Legal.',
      'Vendor accepts Teradyne AI / acceptable-use constraints for this engagement.',
      'Vendor attests compliance with applicable AI / product-safety regulations for the offered service.',
    ],
  },
]

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
