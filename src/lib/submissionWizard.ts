import type {
  DataAccessStatus,
  DataSensitivity,
  Group,
  Site,
  SkillLevel,
  Submission,
} from '@/types'

export const WIZARD_STEPS = [
  { label: 'Basics', sub: 'Title, group, site' },
  { label: 'Use Case', sub: 'Problem, goal, outcome' },
  { label: 'Data', sub: 'Sources, sensitivity' },
  { label: 'Readiness', sub: 'Skills, tools, integrations' },
] as const

export const INTEGRATION_TARGET_OPTIONS = [
  'SharePoint',
  'Teams',
  'Outlook',
  'Dynamics',
  'Snowflake',
  'Power BI',
  'Custom DB',
  'Other',
] as const

export type WizardFormState = {
  title: string
  group: Group | ''
  site: Site | ''
  department: string
  targetUsers: string
  estimatedUsers: string
  useCase: string
  problem: string
  goal: string
  expectedOutcome: string
  expectedBenefitHours: string
  dataSources: string
  dataSensitivity: DataSensitivity | ''
  dataAccessStatus: DataAccessStatus | ''
  skillLevelAvailable: SkillLevel | ''
  existingTools: string[]
  existingToolsOther: string
  integrationTargets: string[]
  integrationOther: string
}

export const EMPTY_WIZARD_FORM: WizardFormState = {
  title: '',
  group: '',
  site: '',
  department: '',
  targetUsers: '',
  estimatedUsers: '',
  useCase: '',
  problem: '',
  goal: '',
  expectedOutcome: '',
  expectedBenefitHours: '',
  dataSources: '',
  dataSensitivity: '',
  dataAccessStatus: '',
  skillLevelAvailable: '',
  existingTools: [],
  existingToolsOther: '',
  integrationTargets: [],
  integrationOther: '',
}

export type ChecklistItem = {
  id: string
  label: string
  complete: boolean
}

export function getWizardChecklist(form: WizardFormState): ChecklistItem[] {
  const hasTechnicalReadiness =
    form.skillLevelAvailable !== '' &&
    (form.existingTools.length > 0 || form.existingToolsOther.trim().length > 0)

  return [
    { id: 'title', label: 'Project title', complete: form.title.trim().length > 0 },
    {
      id: 'group-site',
      label: 'Group & site',
      complete: form.group !== '' && form.site !== '',
    },
    { id: 'department', label: 'Department', complete: form.department.trim().length > 0 },
    {
      id: 'target-users',
      label: 'Target users',
      complete:
        form.targetUsers.trim().length > 0 &&
        form.estimatedUsers.trim().length > 0 &&
        Number(form.estimatedUsers) > 0,
    },
    {
      id: 'use-case',
      label: 'Use case description',
      complete: form.useCase.trim().length > 0,
    },
    { id: 'data-sources', label: 'Data sources', complete: form.dataSources.trim().length > 0 },
    {
      id: 'readiness',
      label: 'Technical readiness',
      complete: hasTechnicalReadiness,
    },
  ]
}

export function buildSubmission(form: WizardFormState): Submission {
  const existingTools = [...form.existingTools]
  if (form.existingToolsOther.trim()) {
    existingTools.push(form.existingToolsOther.trim())
  }

  const integrationTargets = form.integrationTargets.filter((target) => target !== 'Other')
  if (form.integrationTargets.includes('Other') && form.integrationOther.trim()) {
    integrationTargets.push(form.integrationOther.trim())
  }

  return {
    useCase: form.useCase.trim(),
    problem: form.problem.trim(),
    goal: form.goal.trim(),
    targetUsers: form.targetUsers.trim(),
    expectedOutcome: form.expectedOutcome.trim(),
    dataSources: form.dataSources.trim(),
    dataSensitivity: form.dataSensitivity as DataSensitivity,
    dataAccessStatus: form.dataAccessStatus as DataAccessStatus,
    skillLevelAvailable: form.skillLevelAvailable as SkillLevel,
    existingTools,
    integrationTargets,
    estimatedUsers: Number(form.estimatedUsers) || 0,
    expectedBenefitHours: Number(form.expectedBenefitHours) || 0,
  }
}

export function validateWizardStep(step: number, form: WizardFormState): string | null {
  switch (step) {
    case 1:
      if (!form.title.trim()) return 'Project title is required.'
      if (!form.group) return 'Group is required.'
      if (!form.site) return 'Site is required.'
      if (!form.department.trim()) return 'Department is required.'
      if (!form.targetUsers.trim()) return 'Target users are required.'
      if (!form.estimatedUsers.trim() || Number(form.estimatedUsers) <= 0) {
        return 'Estimated number of users is required.'
      }
      return null
    case 2:
      if (!form.useCase.trim()) return 'Use case is required.'
      if (!form.problem.trim()) return 'Problem description is required.'
      if (!form.goal.trim()) return 'Goal is required.'
      if (!form.expectedOutcome.trim()) return 'Expected outcome is required.'
      if (!form.expectedBenefitHours.trim() || Number(form.expectedBenefitHours) <= 0) {
        return 'Expected benefit (hours per month) is required.'
      }
      return null
    case 3:
      if (!form.dataSources.trim()) return 'Data sources are required.'
      if (!form.dataSensitivity) return 'Data sensitivity is required.'
      if (!form.dataAccessStatus) return 'Data access status is required.'
      return null
    case 4:
      if (!form.skillLevelAvailable) return 'Skill level is required.'
      if (form.existingTools.length === 0 && !form.existingToolsOther.trim()) {
        return 'Select at least one existing tool or specify Other.'
      }
      if (form.integrationTargets.length === 0) {
        return 'Select at least one integration target.'
      }
      return null
    default:
      return null
  }
}
