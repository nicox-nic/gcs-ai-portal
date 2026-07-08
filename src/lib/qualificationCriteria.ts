import type { RewardCategory, RiskLevel } from '@/types'

/** AI Readiness — Feasibility ("Can we realistically build, deploy, and operate this AI?") */
export const READINESS_FEASIBILITY = [
  'Required data is available, lawful, and appropriate',
  'Data quality is sufficient for reliable outputs',
  'Models and infrastructure are technically available',
  'Internal skills exist to build or configure the solution',
  'Integration with existing environment (e.g., M365) is feasible',
  'Operational support is feasible (monitoring, retraining, incidents)',
  'Aligned with AI Governance Policy and contractual obligations',
] as const

/** AI Readiness — Viability ("Does this make business sense and sustain over time?") */
export const READINESS_VIABILITY = [
  'Clear linkage to GCS strategic objectives',
  'Business benefits are clearly defined and measurable (Cost Savings, FTE, etc.)',
  'Total costs are understood',
  'Expected value justifies total cost',
  'Solution can scale without disproportionate cost growth',
  'Long-term support is viable',
  'Governance controls are maintainable across lifecycle',
] as const

/** AI Readiness — Desirability ("Do users and stakeholders actually want and accept this AI?") */
export const READINESS_DESIRABILITY = [
  'Addresses a real and validated user pain point',
  'Provides clear value to end users',
  'Fits into existing workflows (e.g., M365 tools)',
  'Supports transparency and human oversight',
  'Builds user trust and acceptance',
  'Change impact (skills, roles, adoption) is manageable',
  'No critical adoption barriers identified',
] as const

export const READINESS_MET_THRESHOLD = 4

/** Section A – Primary (Determining) — ANY true ⇒ AI project */
export const QUALIFICATION_PRIMARY = [
  {
    id: 'A1',
    label: 'Learning or Adaptation — uses machine/deep/reinforcement/statistical learning',
  },
  {
    id: 'A2',
    label: 'Learning or Adaptation — learns or improves performance from data or experience',
  },
  {
    id: 'A3',
    label:
      'Automated Reasoning / Decision Support — inference, prediction, classification, recommendation, or optimization',
  },
  {
    id: 'A4',
    label:
      'Data-Driven Model Usage — relies on trained models and training/validation/inference datasets',
  },
  {
    id: 'A5',
    label:
      'Perception / Language Processing — interprets text, speech, images, video, or sensor data (NLP, OCR, CV)',
  },
  {
    id: 'A6',
    label: 'Generative Capability — generates new content using probabilistic/generative models',
  },
] as const

/** Section B – Supporting (non-determining) */
export const QUALIFICATION_SUPPORTING = [
  { id: 'B1', label: 'Uses third-party AI services/APIs' },
  { id: 'B2', label: 'Includes training, fine-tuning, prompt engineering, or evaluation' },
  {
    id: 'B3',
    label: 'Requires AI-specific risk controls (bias, explainability, drift, hallucination)',
  },
  { id: 'B4', label: 'Requires human-in-the-loop oversight' },
] as const

/** Section C – Exclusions (only if NO Section A is met) */
export const QUALIFICATION_EXCLUSIONS = [
  { id: 'C1', label: 'Static rule-based logic only (IF–THEN, no learning)' },
  { id: 'C2', label: 'Deterministic scripts/workflow automation only' },
  { id: 'C3', label: 'Traditional software calculations/reporting only' },
  { id: 'C4', label: 'Dashboards/visualization without AI inference' },
  { id: 'C5', label: 'Simple keyword search/filtering only' },
] as const

/** Section D – Risk Tier with mandatory controls */
export const RISK_TIER_OPTIONS: {
  risk: RiskLevel
  triggers: string
  controls: string
}[] = [
  {
    risk: 'Low',
    triggers: 'Internal use, no personal data, decision-support only / personal agent',
    controls: 'Basic monitoring',
  },
  {
    risk: 'Medium',
    triggers: 'Impacts operations or employees; limited personal data',
    controls: 'Risk assessment; human oversight; periodic review',
  },
  {
    risk: 'High',
    triggers: 'Customer impact, safety, legal, or sensitive personal data',
    controls: 'Governance committee approval; enhanced controls; continuous monitoring',
  },
]

export const REWARD_CATEGORY_OPTIONS: { value: RewardCategory; label: string }[] = [
  { value: 'Kaizen', label: 'Kaizen' },
  { value: 'TeamProject', label: 'Team Project' },
  { value: 'ManagementInitiative', label: 'Management Initiative' },
  { value: 'Innovation', label: 'Innovation' },
]

export function emptyReadiness(): {
  feasibility: boolean[]
  viability: boolean[]
  desirability: boolean[]
} {
  return {
    feasibility: Array.from({ length: 7 }, () => false),
    viability: Array.from({ length: 7 }, () => false),
    desirability: Array.from({ length: 7 }, () => false),
  }
}

export function emptyQualification(): {
  primary: boolean[]
  supporting: boolean[]
  exclusions: boolean[]
  riskTier: RiskLevel | null
} {
  return {
    primary: Array.from({ length: 6 }, () => false),
    supporting: Array.from({ length: 4 }, () => false),
    exclusions: Array.from({ length: 5 }, () => false),
    riskTier: null,
  }
}
