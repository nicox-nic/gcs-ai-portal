import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoNowIso } from '@/stores/demoClockStore'
import type { Notification, NotificationKind } from '@/types'

type NotificationsStore = {
  notifications: Notification[]
  push: (partial: Omit<Notification, 'id' | 'timestamp' | 'readBy'> & { timestamp?: string }) => Notification
  markRead: (id: string, userId: string) => void
  unreadCountFor: (userId: string) => number
  clear: () => void
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      push: (partial) => {
        const notification: Notification = {
          id: `ntf-${nanoid(8)}`,
          timestamp: partial.timestamp ?? demoNowIso(),
          projectId: partial.projectId,
          projectTitle: partial.projectTitle,
          kind: partial.kind,
          to: partial.to,
          cc: partial.cc,
          subject: partial.subject,
          body: partial.body,
          readBy: [],
        }
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 200),
        }))
        return notification
      },

      markRead: (id, userId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id && !n.readBy.includes(userId)
              ? { ...n, readBy: [...n.readBy, userId] }
              : n,
          ),
        }))
      },

      unreadCountFor: (userId) => {
        return get().notifications.filter(
          (n) =>
            (n.to.includes(userId) || n.cc.includes(userId)) && !n.readBy.includes(userId),
        ).length
      },

      clear: () => set({ notifications: [] }),
    }),
    { name: 'gcs-ai-portal-notifications' },
  ),
)

export function isUnreadFor(notification: Notification, userId: string): boolean {
  return (
    (notification.to.includes(userId) || notification.cc.includes(userId)) &&
    !notification.readBy.includes(userId)
  )
}

export function kindLabel(kind: NotificationKind): string {
  return kind.replace(/-/g, ' ')
}
