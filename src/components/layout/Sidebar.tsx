import {
  FolderKanban,
  GraduationCap,
  Info,
  LayoutDashboard,
  PlusCircle,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types'

type SidebarProps = {
  onNavigate?: () => void
  className?: string
}

type NavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
  roles?: Role[]
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/submit',
    label: 'Submit Project',
    icon: PlusCircle,
    roles: ['Submitter', 'BusinessAnalyst', 'Admin'],
  },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/trainings', label: 'Training Catalog', icon: GraduationCap },
  { to: '/admin', label: 'Admin', icon: Settings, roles: ['Admin'] },
]

function SidebarNavItem({
  to,
  label,
  icon: Icon,
  onNavigate,
}: NavItemConfig & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors',
          isActive
            ? 'bg-indigo-600 text-white [&_svg]:text-white'
            : 'text-stone-900 hover:bg-stone-50 [&_svg]:text-stone-500',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const currentUser = useAuthStore((state) => state.currentUser)

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    if (!currentUser) return false
    return item.roles.includes(currentUser.role)
  })

  return (
    <aside
      className={cn(
        'flex h-full w-[200px] shrink-0 flex-col border-r-[0.5px] border-stone-200 bg-white px-3 py-4',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 border-b-[0.5px] border-stone-200 px-1.5 pb-3.5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-indigo-600 text-[10px] font-medium text-white">
          GCS
        </div>
        <span className="text-xs font-medium text-stone-900">AI Project Portal</span>
      </div>

      <nav className="flex-1">
        {visibleItems.map((item) => (
          <SidebarNavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-1.5 rounded-md bg-stone-50 p-2.5 text-[11px] text-stone-600">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Demo Mode · Phase 0
      </div>
    </aside>
  )
}
