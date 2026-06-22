import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  ClipboardList,
  Database,
  FileSearch,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SEED_USERS } from '@/data/seedRoles'
import { humanizeRole, roleDescription } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types'

const ROLE_ORDER: Role[] = [
  'Submitter',
  'BusinessAnalyst',
  'GovernanceLead',
  'RiskCompliance',
  'DataEngineering',
  'AIProgramManager',
  'MaintenanceSustainability',
  'Sponsor',
  'Admin',
]

const ROLE_ICONS: Record<Role, { icon: LucideIcon; iconClassName: string }> = {
  Submitter: { icon: ClipboardList, iconClassName: 'text-indigo-600' },
  BusinessAnalyst: { icon: FileSearch, iconClassName: 'text-indigo-600' },
  GovernanceLead: { icon: ShieldCheck, iconClassName: 'text-indigo-900' },
  RiskCompliance: { icon: AlertTriangle, iconClassName: 'text-red-700' },
  DataEngineering: { icon: Database, iconClassName: 'text-blue-700' },
  AIProgramManager: { icon: BarChart3, iconClassName: 'text-amber-700' },
  MaintenanceSustainability: { icon: Wrench, iconClassName: 'text-green-800' },
  Sponsor: { icon: Briefcase, iconClassName: 'text-green-800' },
  Admin: { icon: Settings, iconClassName: 'text-stone-600' },
}

export function LoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((state) => state.loginAs)

  const usersByRole = ROLE_ORDER.map((role) =>
    SEED_USERS.find((user) => user.role === role),
  ).filter((user): user is (typeof SEED_USERS)[number] => user !== undefined)

  function handleSelect(user: (typeof SEED_USERS)[number]) {
    loginAs(user)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-[760px]">
        <div className="mb-7 text-center">
          <div className="mb-3.5 inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-[13px] font-bold text-white">
              GCS
            </div>
            <span className="text-xl font-medium text-stone-900">AI Project Portal</span>
          </div>
          <p className="text-sm text-stone-600">Sign in — Demo Mode</p>
        </div>

        <p className="mb-3 text-left text-xs text-stone-500">Select your role</p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {usersByRole.map((user) => {
            const { icon: Icon, iconClassName } = ROLE_ICONS[user.role]
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="rounded-md border-[0.5px] border-stone-200 bg-white p-3.5 text-left transition-colors hover:border-2 hover:border-indigo-600 hover:bg-indigo-50"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${iconClassName}`} />
                  <span className="text-[13px] font-medium text-stone-900">
                    {humanizeRole(user.role)}
                  </span>
                </div>
                <p className="mb-1 text-xs text-stone-900">{user.displayName}</p>
                <p className="text-[11px] leading-snug text-stone-500">
                  {roleDescription(user.role)}
                </p>
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-center text-[11px] text-stone-500">
          Phase 0 — VM-hosted demo · No real backend · No real auth
        </p>
      </div>
    </div>
  )
}
