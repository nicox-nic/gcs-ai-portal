import { Bell, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUserInitials, ROLE_STYLES } from '@/lib/roleStyles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

type TopbarProps = {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const pageTitle = useUiStore((state) => state.pageTitle)
  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)
  const resetProfileSessionFlags = useUiStore((state) => state.resetProfileSessionFlags)

  function handleSignOut() {
    logout()
    resetProfileSessionFlags()
    navigate('/login')
  }

  const avatarStyle = currentUser ? ROLE_STYLES[currentUser.role].avatar : 'bg-stone-100 text-stone-600'

  return (
    <header className="flex shrink-0 items-center justify-between border-b-[0.5px] border-stone-200 bg-white px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="truncate text-sm font-medium text-stone-900">
          {pageTitle || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <Bell className="h-4 w-4 text-stone-500" aria-hidden />
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-600',
                  avatarStyle,
                )}
                aria-label="User menu"
              >
                {getUserInitials(currentUser.displayName)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-900">
                    {currentUser.displayName}
                  </span>
                  <RoleBadge role={currentUser.role} />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>My profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>Switch role</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
