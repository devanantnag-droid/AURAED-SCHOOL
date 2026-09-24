import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { isNativeApp } from '@/lib/platform';
import { MobileMessages } from '@/components/mobile/MobileMessages';
import { listClasses } from '@/services/academics.service';
import {
  createAnnouncement,
  listAnnouncements,
  listColleagues,
  listConversation,
  markMessagesRead,
  sendMessage,
} from '@/services/messaging.service';
import { ROLE_OPTIONS } from '@/types/messaging';
import type { Announcement, AnnouncementTargetType, ColleagueProfile, Message } from '@/types/messaging';
import type { ClassEntity } from '@/types/academics';
import { PageHeader } from '@/components/shared/PageHeader';

function AnnouncementsTab() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('all');
  const [targetRole, setTargetRole] = useState('TEACHER');
  const [targetClassId, setTargetClassId] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [a, c] = await Promise.all([listAnnouncements(profile.schoolId), listClasses(profile.schoolId)]);
    setAnnouncements(a);
    setClasses(c);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleCreate() {
    if (!profile?.schoolId || !title.trim() || !body.trim()) return;
    setErrorMsg(null);
    try {
      await createAnnouncement({ schoolId: profile.schoolId, title, body, targetType, targetRole, targetClassId });
      setTitle('');
      setBody('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to post announcement.'));
    }
  }

  return (
    <div>
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="announcements.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">New announcement</h2>
          <input className="input mb-3 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input mb-3 w-full" rows={3} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={targetType} onChange={(e) => setTargetType(e.target.value as AnnouncementTargetType)}>
              <option value="all">Everyone</option>
              <option value="role">A specific role</option>
              <option value="class">A specific class</option>
            </select>
            {targetType === 'role' && (
              <select className="input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            {targetType === 'class' && (
              <select className="input" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}>
                <option value="">Class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <button onClick={handleCreate} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Post announcement
          </button>
        </section>
      </PermissionGate>

      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-2">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-gray-900 dark:text-gray-50">{a.title}</p>
                <span className="text-xs text-gray-500">
                  {a.targetType === 'all' ? 'Everyone' : a.targetType === 'role' ? a.targetRole : a.targetClassName}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{a.body}</p>
              <p className="mt-1 text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MessagesTab() {
  const { profile } = useAuth();
  const [colleagues, setColleagues] = useState<ColleagueProfile[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    listColleagues(profile.schoolId).then(setColleagues);
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!selectedId) return;
    listConversation(selectedId).then(setConversation);
    markMessagesRead(selectedId);
  }, [selectedId]);

  async function handleSend() {
    if (!profile?.schoolId || !selectedId || !draft.trim()) return;
    setErrorMsg(null);
    try {
      await sendMessage(profile.schoolId, selectedId, draft);
      setDraft('');
      setConversation(await listConversation(selectedId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send message.'));
    }
  }

  return (
    <PermissionGate code="messaging.use" fallback={<p className="text-sm text-gray-500">You don't have permission to use messaging.</p>}>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <p className="mb-2 text-xs font-medium text-gray-500">Colleagues</p>
          {colleagues.length === 0 ? (
            <p className="text-xs text-gray-500">No one else found at your school yet.</p>
          ) : (
            <ul className="space-y-1">
              {colleagues.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      selectedId === c.id ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {c.fullName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-2">
          {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
          {!selectedId ? (
            <p className="text-sm text-gray-500">Pick a colleague to start a conversation.</p>
          ) : (
            <>
              <div className="mb-3 max-h-80 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-800">
                {conversation.length === 0 ? (
                  <p className="text-xs text-gray-500">No messages yet — say hello.</p>
                ) : (
                  conversation.map((m) => (
                    <div key={m.id} className={`max-w-[80%] rounded-md px-3 py-1.5 text-sm ${m.senderId === selectedId ? 'bg-gray-100 dark:bg-gray-800' : 'ml-auto bg-primary-100 dark:bg-primary-950'}`}>
                      {m.body}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}

export function MessagingPage() {
  const [tab, setTab] = useState<'announcements' | 'messages'>('announcements');

  if (isNativeApp()) {
    return <MobileMessages />;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Announcements & Messages" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['announcements', 'messages'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 capitalize ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'announcements' ? (
        <FeatureGate feature="announcements">
          <AnnouncementsTab />
        </FeatureGate>
      ) : (
        <FeatureGate feature="messaging">
          <MessagesTab />
        </FeatureGate>
      )}
    </div>
  );
}
