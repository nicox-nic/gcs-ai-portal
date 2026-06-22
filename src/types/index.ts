export type Role =
  | 'Submitter'
  | 'BusinessAnalyst'
  | 'GovernanceLead'
  | 'RiskCompliance'
  | 'DataEngineering'
  | 'AIProgramManager'
  | 'MaintenanceSustainability'
  | 'Sponsor'
  | 'Admin'

export type Group = 'Engineering' | 'Field' | 'PROGs' | 'Marketing'

export type Site = 'Cebu' | 'Costa Rica' | 'Japan' | 'Korea'

export type LifecycleStage =
  | 'Assessment'
  | 'Policy'
  | 'SupplierOversight'
  | 'Development'
  | 'Deployment'
  | 'Use'
  | 'Improvement'
  | 'Decommissioning'
  | 'Enablement'

export type StageStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked'

export type RiskLevel = 'Low' | 'Medium' | 'High'

export type ProjectStatus =
  | 'Draft'
  | 'Submitted'
  | 'Qualified'
  | 'InProgress'
  | 'OnHold'
  | 'Completed'
  | 'Rejected'
  | 'Decommissioned'

export type SkillLevel = 'None' | 'Basic' | 'Intermediate' | 'Advanced'

export type DataSensitivity = 'Public' | 'Internal' | 'Confidential' | 'Restricted'

export type TrainingFormat = 'Self-paced' | 'Instructor-led' | 'Workshop' | 'Video'

export type TrainingAvailability = 'Available' | 'ComingSoon'

export type DataAccessStatus = 'Available' | 'NeedAccess' | 'Unknown'

export interface User {
  id: string
  displayName: string
  role: Role
  group: Group
  site: Site
  department: string
}

export interface Tool {
  id: string
  name: string
  category: string
  vendor: string
  description: string
  typicalUseCases: string[]
  requiredSkillLevel: SkillLevel
  maxDataSensitivity: DataSensitivity
  trainingIds: string[]
  gettingStartedUrl: string
  lastReviewed: string
  iconHint: string
}

export interface Training {
  id: string
  title: string
  provider: string
  format: TrainingFormat
  durationHours: number
  skillLevel: SkillLevel
  toolIds: string[]
  url: string
  description: string
  availability: TrainingAvailability
  availableFromLabel?: string
}

export interface ToolCombo {
  id: string
  name: string
  description: string
  primaryToolId: string
  addOnToolIds: string[]
  addOnRoles: Record<string, string>
  matchScore: number
  bestForKeywords: string[]
  skillLevelRequired: SkillLevel
  riskFlags: string[]
}

export interface Submission {
  useCase: string
  problem: string
  goal: string
  targetUsers: string
  expectedOutcome: string
  dataSources: string
  dataSensitivity: DataSensitivity
  dataAccessStatus: DataAccessStatus
  skillLevelAvailable: SkillLevel
  existingTools: string[]
  integrationTargets: string[]
  estimatedUsers: number
  expectedBenefitHours: number
}

export interface ToolStackEntry {
  toolId: string
  role: 'primary' | 'supporting'
  usageNote?: string
}

export interface Recommendation {
  toolId: string
  rank: number
  confidence: number
  rationale: string
  riskFlags: string[]
  rulesFired: string[]
}

export interface StageTransition {
  id: string
  projectId: string
  fromStage: LifecycleStage | null
  toStage: LifecycleStage
  fromStatus: StageStatus | null
  toStatus: StageStatus
  actorUserId: string
  actorRole: Role
  timestamp: string
  note: string
}

export interface Project {
  id: string
  title: string
  submitterId: string
  sponsorId: string | null
  group: Group
  site: Site
  department: string
  status: ProjectStatus
  currentStage: LifecycleStage
  stageStatus: Record<LifecycleStage, StageStatus>
  submission: Submission
  recommendations: Recommendation[]
  alternativeRecommendations: Recommendation[]
  recommendedComboIds: string[]
  toolStack: ToolStackEntry[]
  createdAt: string
  updatedAt: string
  auditLog: StageTransition[]
  reportedBenefitHours: number | null
  sponsorValidated: boolean
}
