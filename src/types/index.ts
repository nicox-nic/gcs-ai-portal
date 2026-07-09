export type Role =
  | 'Submitter'
  | 'BusinessAnalyst'
  | 'GovernanceLead'
  | 'RiskCompliance'
  | 'DataEngineering'
  | 'AIProgramManager'
  | 'MaintenanceSustainability'
  | 'Sponsor'
  | 'EHS'
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
  | 'IdeaDraft'
  | 'ForAssessment'
  | 'NotQualified'
  | 'Cancelled'
  | 'Qualified'
  | 'QualifiedDraft'
  | 'Submitted'
  | 'Rejected'
  | 'ForEHSReview'
  | 'EHSRejected'
  | 'Active'
  | 'ForSponsorApproval'
  | 'Disapproved'
  | 'Completed'
  | 'Idle'
  | 'Deactivated'

/** 1:1 with RiskLevel: Tier1=Low, Tier2=Medium, Tier3=High */
export type ProjectTier = 'Tier1' | 'Tier2' | 'Tier3'

export type RewardCategory = 'Kaizen' | 'TeamProject' | 'ManagementInitiative' | 'Innovation'

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
  /** Profile setup (V3 Phase 1) — optional until profileComplete */
  skillLevel?: SkillLevel
  toolChain?: string[]
  integrationTargets?: string[]
  profileComplete?: boolean
}

/** AI Readiness Checklist — item text lands in Phase 3 */
export interface ReadinessAssessment {
  feasibility: boolean[] // 7 items, 0/1
  viability: boolean[] // 7 items
  desirability: boolean[] // 7 items
}

/** AI Qualification Checklist — item text lands in Phase 3 */
export interface QualificationAssessment {
  primary: boolean[] // A1–A6 (any true ⇒ qualifies as AI)
  supporting: boolean[] // B1–B4
  exclusions: boolean[] // C1–C5
  riskTier: RiskLevel | null // Section D selection
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

export type RequirementPriority = 'Must' | 'Should' | 'Could'

export interface RequirementItem {
  id: string
  text: string
  priority: RequirementPriority
}

export interface RequirementsArtifact {
  items: RequirementItem[]
  notes: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type UatResult = 'Pass' | 'Fail' | 'Untested'

export interface UatCase {
  id: string
  description: string
  result: UatResult
}

export interface UatArtifact {
  cases: UatCase[]
  outcome: 'Pass' | 'Fail' | 'Pending'
  notes: string
  signedOffBy: string | null
  signedOffAt: string | null
}

export type HealthState = 'Healthy' | 'Watch' | 'Incident'
export type DriftState = 'None' | 'Suspected' | 'Confirmed'
export type IncidentSeverity = 'Low' | 'Medium' | 'High'
export type IncidentStatus = 'Open' | 'Closed'

export interface Incident {
  id: string
  openedAt: string
  severity: IncidentSeverity
  summary: string
  status: IncidentStatus
  closedAt: string | null
  note: string
}

export interface OperationsRecord {
  health: HealthState
  incidents: Incident[]
  drift: DriftState
  driftNote: string
  lastReviewedAt: string | null
}

export interface Project {
  id: string
  title: string
  submitterId: string
  sponsorId: string | null
  /** Assigned Business Analyst (RACI owner for requirements + UAT). */
  businessAnalystId: string | null
  /** Lead builder — Development owner-of-record. */
  dataEngineerId: string | null
  /** Deployment / program lead. */
  programManagerId: string | null
  /** Operational owner for the live project (Use). */
  maintenanceOwnerId: string | null
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
  /** How the project was created — defaults to manual for seeds / legacy. */
  intakeMode?: 'manual' | 'assisted'
  tier: ProjectTier | null
  tierRationale: string
  autoTiered: boolean
  rewardCategory: RewardCategory | null
  ehsCoordinatorId: string | null
  qualification: QualificationAssessment | null
  readiness: ReadinessAssessment | null
  /** BA requirements artifact — null until started. */
  requirements: RequirementsArtifact | null
  /** BA UAT artifact — null until started. */
  uat: UatArtifact | null
  /** M&S operations overlay — null until go-live. */
  operations: OperationsRecord | null
  activeSince: string | null
  lastActivityAt: string
  sponsorDecision: 'Approved' | 'Disapproved' | null
  sponsorDecisionNote: string
  /** Highest aging milestone already applied (idempotent runAging). */
  agingMilestone?: AgingMilestone
}

export type AgingMilestone = 'none' | 'reminder' | 'idle' | 'alert' | 'deactivated'

export type NotificationKind =
  | 'submitted-for-assessment'
  | 'qualified'
  | 'not-qualified'
  | 'submitted-for-review'
  | 'approved'
  | 'rejected'
  | 'ehs-review-requested'
  | 'ehs-approved'
  | 'ehs-rejected'
  | 'sponsor-approval-requested'
  | 'completed'
  | 'disapproved'
  | 'project-review-logged'
  | 'aging-reminder'
  | 'aging-idle'
  | 'aging-alert'
  | 'aging-deactivated'
  | 'reactivated'
  | 'requirements-requested'
  | 'requirements-confirmed'
  | 'uat-requested'
  | 'uat-signed-off'
  | 'development-started'
  | 'deployment-started'
  | 'go-live'
  | 'incident-opened'
  | 'incident-closed'
  | 'drift-flagged'

export interface Notification {
  id: string
  timestamp: string
  projectId: string
  projectTitle: string
  kind: NotificationKind
  to: string[]
  cc: string[]
  subject: string
  body: string
  readBy: string[]
}

export interface CiPortalRecord {
  ciId: string
  projectName: string
  status: ProjectStatus
  rewardCategory: RewardCategory | null
  tier: ProjectTier | null
  submitterName: string
  leaderName: string
  sponsorName: string
  businessAnalystName: string
  dataEngineerName: string
  programManagerName: string
  maintenanceOwnerName: string
  requirementsStatus: string
  uatStatus: string
  healthStatus: string
  driftStatus: string
  group: Group
  site: Site
  createdAt: string
  activeSince: string | null
  lastActivityAt: string
  reportedBenefitHours: number | null
}
