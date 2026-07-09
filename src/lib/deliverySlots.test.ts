import { describe, expect, it } from 'vitest'
import {
  canAssignBusinessAnalyst,
  canAssignDataEngineer,
  canAssignDeliverySlot,
  canAssignMaintenanceOwner,
  canAssignProgramManager,
  canOpenDeliverySlotPicker,
} from '@/lib/deliverySlots'
import type { User } from '@/types'

const gov: User = {
  id: 'usr-govlead',
  displayName: 'Gov',
  role: 'GovernanceLead',
  group: 'PROGs',
  site: 'Cebu',
  department: 'Gov',
}
const de: User = {
  id: 'usr-data',
  displayName: 'DE',
  role: 'DataEngineering',
  group: 'PROGs',
  site: 'Cebu',
  department: 'DE',
}
const pm: User = {
  id: 'usr-pm',
  displayName: 'PM',
  role: 'AIProgramManager',
  group: 'PROGs',
  site: 'Cebu',
  department: 'PM',
}
const ms: User = {
  id: 'usr-maint',
  displayName: 'M&S',
  role: 'MaintenanceSustainability',
  group: 'Field',
  site: 'Costa Rica',
  department: 'Ops',
}
const submitter: User = {
  id: 'usr-submitter',
  displayName: 'Sub',
  role: 'Submitter',
  group: 'Engineering',
  site: 'Cebu',
  department: 'Eng',
}

describe('deliverySlots (Phase 10)', () => {
  it('canAssignBusinessAnalyst is governance-only', () => {
    expect(canAssignBusinessAnalyst(gov)).toBe(true)
    expect(canAssignBusinessAnalyst(pm)).toBe(true)
    expect(canAssignBusinessAnalyst(de)).toBe(false)
  })

  it('allows governance to assign any delivery slot including clear', () => {
    expect(canAssignDataEngineer(gov, 'usr-data')).toBe(true)
    expect(canAssignDataEngineer(gov, null)).toBe(true)
    expect(canAssignProgramManager(pm, 'usr-pm')).toBe(true)
    expect(canAssignMaintenanceOwner(gov, 'usr-maint')).toBe(true)
  })

  it('allows self-claim for matching role and denies assigning others', () => {
    expect(canAssignDataEngineer(de, 'usr-data')).toBe(true)
    expect(canAssignDataEngineer(de, 'usr-other')).toBe(false)
    expect(canAssignDataEngineer(de, null)).toBe(false)
    expect(canAssignProgramManager(pm, 'usr-pm')).toBe(true)
    expect(canAssignMaintenanceOwner(ms, 'usr-maint')).toBe(true)
    expect(canAssignDeliverySlot(submitter, 'de', 'usr-data')).toBe(false)
  })

  it('canOpenDeliverySlotPicker for governance and matching role', () => {
    expect(canOpenDeliverySlotPicker(gov, 'de')).toBe(true)
    expect(canOpenDeliverySlotPicker(de, 'de')).toBe(true)
    expect(canOpenDeliverySlotPicker(de, 'pm')).toBe(false)
    expect(canOpenDeliverySlotPicker(submitter, 'ms')).toBe(false)
  })
})
