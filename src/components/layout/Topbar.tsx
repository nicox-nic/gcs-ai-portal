import { Bell, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
import { cn, formatRelative } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { isUnreadFor, useNotificationsStore } from '@/stores/notificationsStore'
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
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const unreadCount = useNotificationsStore((s) =>
    currentUser ? s.unreadCountFor(currentUser.id) : 0,
  )

  function handleSignOut() {
    logout()
    resetProfileSessionFlags()
    navigate('/login')
  }

  const avatarStyle = currentUser ? ROLE_STYLES[currentUser.role].avatar : 'bg-stone-100 text-stone-600'

  const recent = currentUser
    ? notifications
        .filter((n) => n.to.includes(currentUser.id) || n.cc.includes(currentUser.id))
        .slice(0, 6)
    : []

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative rounded-md p-1.5 text-stone-500 outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-900">Notifications</span>
                <span className="text-[10px] text-stone-500">Mock email feed</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recent.length === 0 && (
              <div className="px-2 py-4 text-center text-[11px] text-stone-500">
                No notifications yet.
              </div>
            )}
            {recent.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                onClick={() => {
                  if (currentUser && isUnreadFor(n, currentUser.id)) {
                    markRead(n.id, currentUser.id)
                  }
                  navigate(`/projects/${n.projectId}`)
                }}
              >
                <span
                  className={cn(
                    'line-clamp-1 text-[11px]',
                    currentUser && isUnreadFor(n, currentUser.id)
                      ? 'font-semibold text-stone-900'
                      : 'text-stone-700',
                  )}
                >
                  {n.subject}
                </span>
                <span className="text-[10px] text-stone-500">{formatRelative(n.timestamp)}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full text-center text-xs text-indigo-700">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
