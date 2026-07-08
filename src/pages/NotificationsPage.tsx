import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { getUserDisplayName } from '@/lib/projectDisplay'
import { formatDateTime, formatRelative } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { isUnreadFor, kindLabel, useNotificationsStore } from '@/stores/notificationsStore'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const clear = useNotificationsStore((s) => s.clear)

  const mine = currentUser
    ? notifications.filter(
        (n) => n.to.includes(currentUser.id) || n.cc.includes(currentUser.id),
      )
    : notifications

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Mock email-style feed (TO / CC). Demo timestamps follow the demo clock."
        className="mb-4"
        action={
          <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => clear()}>
            Clear feed
          </Button>
        }
      />

      <div className="mb-3 rounded-md border-[0.5px] border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
        Email-style mock · not a real mailbox. Recipients are seed user IDs resolved to display
        names.
      </div>

      <div className="space-y-3">
        {mine.length === 0 && (
          <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
            No notifications yet. Advance the demo clock or walk a project through a gate.
          </div>
        )}
        {mine.map((n) => {
          const unread = currentUser ? isUnreadFor(n, currentUser.id) : false
          return (
            <div
              key={n.id}
              className={cn(
                'rounded-lg border-[0.5px] bg-white p-4',
                unread ? 'border-indigo-200' : 'border-stone-200',
              )}
            >
              <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-stone-900">{n.subject}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-500">
                    {kindLabel(n.kind)}
                  </div>
                </div>
                <div className="text-right text-[10px] text-stone-500">
                  <div title={formatDateTime(n.timestamp)}>{formatRelative(n.timestamp)}</div>
                  {unread && currentUser && (
                    <button
                      type="button"
                      className="mt-1 text-indigo-700 hover:underline"
                      onClick={() => markRead(n.id, currentUser.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              <p className="mb-2 text-[11px] text-stone-600">{n.body}</p>
              <div className="mb-2 grid gap-1 text-[10px] text-stone-500 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-stone-700">TO: </span>
                  {n.to.map((id) => getUserDisplayName(id)).join(', ') || '—'}
                </div>
                <div>
                  <span className="font-semibold text-stone-700">CC: </span>
                  {n.cc.map((id) => getUserDisplayName(id)).join(', ') || '—'}
                </div>
              </div>
              <Link
                to={`/projects/${n.projectId}`}
                className="text-[11px] font-medium text-indigo-700 hover:underline"
              >
                Open {n.projectTitle} →
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
