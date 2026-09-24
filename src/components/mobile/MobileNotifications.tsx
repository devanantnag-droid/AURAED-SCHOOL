import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, BookOpen, Wallet, Megaphone, CalendarOff, FileStack } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { listMyNotifications, markAllAsRead, markAsRead } from '@/services/notifications.service';
import type { AppNotification } from '@/services/notifications.service';

const typeIcons: Record<string, LucideIcon> = {
  attendance: CalendarCheck,
  homework: BookOpen,
  assignment: BookOpen,
  fees: Wallet,
  announcement: Megaphone,
  circular: FileStack,
  leave_decision: CalendarOff,
  leave_request: CalendarOff,
  platform_announcement: Megaphone,
};

export function MobileNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  async function load() {
    setNotifications(await listMyNotifications(50));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleTap(n: AppNotification) {
    if (!n.isRead) {
      await markAsRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div>
      <MobileDetailHeader title="Notifications" />

      {hasUnread && (
        <div className="flex justify-end px-4 pt-3">
          <button onClick={handleMarkAllRead} className="text-xs font-medium text-primary-600 hover:underline">
            Mark all read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <Bell size={32} />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 px-2 py-2 dark:divide-gray-800">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <li key={n.id}>
                <button
                  onClick={() => handleTap(n)}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-gray-50' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </span>
                    {n.body && <span className="mt-0.5 block truncate text-xs text-gray-500">{n.body}</span>}
                    <span className="mt-0.5 block text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
