import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/types/roles';
import { getUnreadCount, listMyNotifications, markAllAsRead, markAsRead } from '@/services/notifications.service';
import type { AppNotification } from '@/services/notifications.service';

const POLL_INTERVAL_MS = 45_000;

export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refreshCount() {
    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      // Non-critical — a failed poll just tries again next interval.
    }
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      setLoading(true);
      try {
        setNotifications(await listMyNotifications());
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      await markAsRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);

    // Notification links are written once by a database trigger, shared by
    // every recipient of that event — but students/parents have no route
    // into /school/* admin pages at all (that content lives inside their
    // own dashboard's tabs instead). For the notification types they can
    // receive, send them to their own dashboard rather than the admin link.
    const isStudent = roles.some((r) => r.roleName === ROLES.STUDENT);
    const isParent = roles.some((r) => r.roleName === ROLES.PARENT);
    const portalOnlyTypes = ['announcement', 'event', 'homework', 'assignment', 'grievance_reply', 'circular'];

    if ((isStudent || isParent) && portalOnlyTypes.includes(n.type)) {
      navigate(isStudent ? '/student/dashboard' : '/parent/dashboard');
    } else if (n.link) {
      navigate(n.link);
    }
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`fixed inset-x-4 top-16 z-50 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:top-auto sm:mt-2 sm:w-80 ${
            align === 'left' ? 'sm:left-0' : 'sm:right-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-gray-500">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`block w-full border-b border-gray-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${!n.isRead ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                >
                  <p className="font-medium text-gray-900 dark:text-gray-50">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
