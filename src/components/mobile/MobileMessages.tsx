import { useEffect, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { listColleagues, listConversation, sendMessage, markMessagesRead } from '@/services/messaging.service';
import type { ColleagueProfile, Message } from '@/types/messaging';

export function MobileMessages() {
  const { profile } = useAuth();
  const [colleagues, setColleagues] = useState<ColleagueProfile[]>([]);
  const [active, setActive] = useState<ColleagueProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    listColleagues(profile.schoolId).then(setColleagues).catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load contacts.')));
  }, [profile?.schoolId]);

  async function openConversation(person: ColleagueProfile) {
    setActive(person);
    setErrorMsg(null);
    try {
      const msgs = await listConversation(person.id);
      setMessages(msgs);
      await markMessagesRead(person.id);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load conversation.'));
    }
  }

  async function handleSend() {
    if (!active || !profile?.schoolId || !draft.trim()) return;
    const body = draft;
    setDraft('');
    try {
      await sendMessage(profile.schoolId, active.id, body);
      setMessages(await listConversation(active.id));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send message.'));
    }
  }

  if (active) {
    return (
      <div className="flex h-full flex-col">
        <MobileDetailHeader title={active.fullName} onBack={() => setActive(null)} />

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {errorMsg && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No messages yet — say hello.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderId === active.id ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.senderId === active.id
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      : 'bg-primary-700 text-white'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
          <input
            className="input flex-1"
            placeholder="Write a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white">
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MobileDetailHeader title="Messages" />
      {errorMsg && <p className="m-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {colleagues.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <MessageSquare size={32} />
          <p className="text-sm">No contacts yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {colleagues.map((c) => (
            <li key={c.id}>
              <button onClick={() => openConversation(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50 dark:active:bg-gray-800">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  {c.fullName.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-50">{c.fullName}</span>
                  <span className="block truncate text-xs text-gray-500">{c.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
