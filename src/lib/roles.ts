import type { Role } from '@/types'

/** Roles allowed to create / submit new projects via intake. */
export const SUBMIT_ROLES: Role[] = [
  'Submitter',
  'BusinessAnalyst',
  'DataEngineering',
  'AIProgramManager',
  'MaintenanceSustainability',
  'Admin',
]

/** Roles that may assign delivery-ownership tier on Qualified projects. */
export const DELIVERY_TIER_ASSIGN_ROLES: Role[] = [
  'DataEngineering',
  'GovernanceLead',
  'Admin',
]

/** PM Accept/Reject delivery gates — Admin may act as well. */
export const PM_GATE_REVIEWER_ROLES: Role[] = ['AIProgramManager', 'Admin']
