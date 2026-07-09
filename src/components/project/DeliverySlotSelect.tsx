import { UserRound } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SEED_USERS } from '@/data/seedRoles'
import {
  canOpenDeliverySlotPicker,
  type DeliverySlot,
} from '@/lib/deliverySlots'
import { getUserDisplayName } from '@/lib/projectDisplay'
import type { Project, Role, User } from '@/types'

const SLOT_META: Record<
  DeliverySlot,
  { label: string; short: string; role: Role; field: keyof Project }
> = {
  ba: {
    label: 'Business Analyst',
    short: 'BA',
    role: 'BusinessAnalyst',
    field: 'businessAnalystId',
  },
  de: {
    label: 'Data Engineer',
    short: 'DE',
    role: 'DataEngineering',
    field: 'dataEngineerId',
  },
  pm: {
    label: 'Program Manager',
    short: 'PM',
    role: 'AIProgramManager',
    field: 'programManagerId',
  },
  ms: {
    label: 'Maintenance Owner',
    short: 'M&S',
    role: 'MaintenanceSustainability',
    field: 'maintenanceOwnerId',
  },
}

type DeliverySlotSelectProps = {
  project: Project
  slot: DeliverySlot
  currentUser: User | null
  onAssign: (userId: string | null) => void
  /** When true, matching-role users only see "Claim me" (self), not full list / clear. */
  selfClaimOnly?: boolean
}

export function DeliverySlotSelect({
  project,
  slot,
  currentUser,
  onAssign,
}: DeliverySlotSelectProps) {
  const meta = SLOT_META[slot]
  const assignedId = project[meta.field] as string | null
  const assignedName = assignedId ? getUserDisplayName(assignedId) : null
  const canOpen = canOpenDeliverySlotPicker(currentUser, slot)
  const isGovernance =
    currentUser &&
    (currentUser.role === 'Admin' ||
      currentUser.role === 'GovernanceLead' ||
      currentUser.role === 'AIProgramManager')
  const isSelfClaimer =
    currentUser && currentUser.role === meta.role && !isGovernance

  if (!canOpen && !assignedName) return null

  const candidates = SEED_USERS.filter((u) => u.role === meta.role)

  if (!canOpen) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
        <UserRound className="h-3.5 w-3.5" />
        <span className="text-stone-400">{meta.short}:</span>
        <span>{assignedName}</span>
      </span>
    )
  }

  if (isSelfClaimer) {
    if (assignedId === currentUser.id) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
          <UserRound className="h-3.5 w-3.5" />
          <span className="text-stone-400">{meta.short}:</span>
          <span>You</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="h-3.5 w-3.5 text-stone-500" />
        <button
          type="button"
          className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[11px] text-indigo-700 hover:border-indigo-200"
          onClick={() => onAssign(currentUser.id)}
        >
          Claim as {meta.short}
          {assignedName ? ` (now ${assignedName})` : ''}
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <UserRound className="h-3.5 w-3.5 text-stone-500" />
      <span className="text-[10px] text-stone-400">{meta.short}</span>
      <Select
        value={assignedId ?? '__none__'}
        onValueChange={(value) => onAssign(value === '__none__' ? null : value)}
      >
        <SelectTrigger className="h-7 w-[150px] border-stone-200 text-[11px]">
          <SelectValue placeholder={`Assign ${meta.short}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__" className="text-xs">
            No {meta.short}
          </SelectItem>
          {candidates.map((user) => (
            <SelectItem key={user.id} value={user.id} className="text-xs">
              {user.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  )
}
