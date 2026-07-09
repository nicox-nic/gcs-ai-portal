import type { Project, Role, User } from '@/types'

export type DeliverySlot = 'ba' | 'de' | 'pm' | 'ms'

const GOVERNANCE_ASSIGNERS: Role[] = ['Admin', 'GovernanceLead', 'AIProgramManager']

const SLOT_ROLE: Record<Exclude<DeliverySlot, 'ba'>, Role> = {
  de: 'DataEngineering',
  pm: 'AIProgramManager',
  ms: 'MaintenanceSustainability',
}

/** Governance assigners (same as BA) — used for BA and for assigning others. */
export function canAssignBusinessAnalyst(user: User | null): boolean {
  if (!user) return false
  return GOVERNANCE_ASSIGNERS.includes(user.role)
}

/**
 * Whether `actor` may set the given delivery slot on a project.
 * GovernanceLead / AIProgramManager / Admin may assign anyone;
 * a matching-role user may self-claim (set themselves) only.
 */
export function canAssignDeliverySlot(
  actor: User | null,
  slot: DeliverySlot,
  assigneeId: string | null,
): boolean {
  if (!actor) return false
  if (slot === 'ba') return canAssignBusinessAnalyst(actor)
  if (GOVERNANCE_ASSIGNERS.includes(actor.role)) return true
  const role = SLOT_ROLE[slot]
  // Self-claim: matching role assigning themselves (or clearing only if currently them — clear via null denied for self)
  if (actor.role === role && assigneeId === actor.id) return true
  return false
}

export function canAssignDataEngineer(
  actor: User | null,
  assigneeId: string | null,
): boolean {
  return canAssignDeliverySlot(actor, 'de', assigneeId)
}

export function canAssignProgramManager(
  actor: User | null,
  assigneeId: string | null,
): boolean {
  return canAssignDeliverySlot(actor, 'pm', assigneeId)
}

export function canAssignMaintenanceOwner(
  actor: User | null,
  assigneeId: string | null,
): boolean {
  return canAssignDeliverySlot(actor, 'ms', assigneeId)
}

/** True if the user may open the assignment control (governance or matching role for self-claim). */
export function canOpenDeliverySlotPicker(user: User | null, slot: DeliverySlot): boolean {
  if (!user) return false
  if (slot === 'ba') return canAssignBusinessAnalyst(user)
  if (GOVERNANCE_ASSIGNERS.includes(user.role)) return true
  return user.role === SLOT_ROLE[slot]
}

export function deliverySlotField(
  slot: Exclude<DeliverySlot, 'ba'>,
): keyof Pick<Project, 'dataEngineerId' | 'programManagerId' | 'maintenanceOwnerId'> {
  if (slot === 'de') return 'dataEngineerId'
  if (slot === 'pm') return 'programManagerId'
  return 'maintenanceOwnerId'
}
