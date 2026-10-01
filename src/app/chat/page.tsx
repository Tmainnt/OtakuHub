'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/services/api';

type ChatRoom = { id: number; name: string; is_private: boolean; is_member: boolean; is_leader: boolean; member_count: number };
type ChatMessage = { id: number; room_id: number; sender_id: number; sender_username: string; content: string; created_at: string };
type RoomMember = { user_id: number; username: string; role: 'member' | 'leader' };
type RoomManagement = { invite_code: string; members: RoomMember[] };

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [connection, setConnection] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [management, setManagement] = useState<RoomManagement | null>(null);
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>([]);
  const [managementError, setManagementError] = useState('');
  const [managementSaving, setManagementSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const activeRoomRef = useRef<ChatRoom | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  function chooseRoom(room: ChatRoom | null) {
    activeRoomRef.current = room;
    setActiveRoom(room);
    if (room) localStorage.setItem('chatRoomId', String(room.id));
    else localStorage.removeItem('chatRoomId');
  }

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('userId') || '');
  }, []);

  const loadRooms = useCallback(async (): Promise<ChatRoom[]> => {
    try {
      const data = await fetchAPI('/chat/rooms');
      const nextRooms: ChatRoom[] = Array.isArray(data) ? data : [];
      setRooms(nextRooms);
      const savedRoomID = activeRoomRef.current?.id ?? Number(localStorage.getItem('chatRoomId'));
      const selectedRoom = nextRooms.find((room) => room.id === savedRoomID) ?? null;
      activeRoomRef.current = selectedRoom;
      setActiveRoom(selectedRoom);
      if (selectedRoom) localStorage.setItem('chatRoomId', String(selectedRoom.id));
      else localStorage.removeItem('chatRoomId');
      setError('');
      return nextRooms;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load chat rooms.');
      return [];
    }
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  useEffect(() => {
    if (!activeRoom || !activeRoom.is_member) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    messagesRef.current = [];
    setMessages([]);
    setConnection('connecting');

    const pollMessages = async () => {
      try {
        const latestID = messagesRef.current[messagesRef.current.length - 1]?.id ?? 0;
        const data = await fetchAPI(`/chat/rooms/${activeRoom.id}/messages?after_id=${latestID}`) as ChatMessage[];
        if (cancelled) return;
        if (Array.isArray(data) && data.length) {
          setMessages((current) => {
            const known = new Set(current.map((message) => message.id));
            return [...current, ...data.filter((message) => !known.has(message.id))].sort((a, b) => a.id - b.id);
          });
        }
        setConnection('connected');
      } catch {
        if (!cancelled) setConnection('error');
      }
    };

    void pollMessages();
    const timer = window.setInterval(() => { void pollMessages(); }, 1500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeRoom?.id, activeRoom?.is_member]);

  useEffect(() => {
    setMessageText(activeRoom ? localStorage.getItem(`chatDraft:${activeRoom.id}`) || '' : '');
  }, [activeRoom?.id]);

  useEffect(() => {
    if (!activeRoom?.is_leader) {
      setManagement(null);
      setSelectedLeaders([]);
      return;
    }
    let cancelled = false;
    setManagementError('');
    fetchAPI(`/chat/rooms/${activeRoom.id}/management`).then((data: RoomManagement) => {
      if (!cancelled) setManagement(data);
    }).catch((err: unknown) => {
      if (!cancelled) setManagementError(err instanceof Error ? err.message : 'Could not load room management.');
    });
    return () => { cancelled = true; };
  }, [activeRoom?.id, activeRoom?.is_leader]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = roomName.trim();
    if (!name) {
      setCreateError('Please enter a room name.');
      return;
    }

    setSaving(true);
    setCreateError('');
    setNotice('');
    try {
      const room = await fetchAPI('/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({ name, is_private: isPrivate }),
      }) as ChatRoom;
      setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)]);
      chooseRoom(room);
      setRoomName('');
      setIsPrivate(false);
      setCreateOpen(false);
      setNotice(`Room “${room.name}” was created.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create the room. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = messageText.trim();
    if (!activeRoom || !content || sending) return;
    setSending(true);
    setMessageError('');
    try {
      const message = await fetchAPI(`/chat/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }) as ChatMessage;
      if (activeRoomRef.current?.id === message.room_id) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        setMessageText('');
        localStorage.removeItem(`chatDraft:${message.room_id}`);
        setConnection('connected');
      }
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  async function joinActiveRoom() {
    if (!activeRoom || joining) return;
    setJoining(true);
    setJoinError('');
    try {
      await fetchAPI(`/chat/rooms/${activeRoom.id}/join`, { method: 'POST' });
      chooseRoom({ ...activeRoom, is_member: true, member_count: activeRoom.member_count + 1 });
      await loadRooms();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join this room.');
    } finally {
      setJoining(false);
    }
  }

  async function joinWithInviteCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await fetchAPI('/chat/join', { method: 'POST', body: JSON.stringify({ invite_code: joinCode.trim() }) }) as { room_id: number };
      setJoinCode('');
      const nextRooms = await loadRooms();
      chooseRoom(nextRooms.find((room) => room.id === result.room_id) ?? null);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join with that invitation code.');
    } finally {
      setJoining(false);
    }
  }

  async function promoteSelectedLeaders() {
    if (!activeRoom || selectedLeaders.length === 0) return;
    setManagementSaving(true);
    setManagementError('');
    try {
      await fetchAPI(`/chat/rooms/${activeRoom.id}/leaders`, { method: 'POST', body: JSON.stringify({ user_ids: selectedLeaders }) });
      const data = await fetchAPI(`/chat/rooms/${activeRoom.id}/management`) as RoomManagement;
      setManagement(data);
      setSelectedLeaders([]);
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : 'Could not update room leaders.');
    } finally {
      setManagementSaving(false);
    }
  }

  async function deleteActiveRoom() {
    if (!activeRoom || !activeRoom.is_leader || !window.confirm(`Delete “${activeRoom.name}” and all its messages? This cannot be undone.`)) return;
    try {
      await fetchAPI(`/chat/rooms/${activeRoom.id}`, { method: 'DELETE' });
      chooseRoom(null);
      setManagement(null);
      setRooms((current) => current.filter((room) => room.id !== activeRoom.id));
      setNotice(`Room “${activeRoom.name}” was deleted.`);
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : 'Could not delete this room.');
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 overflow-hidden bg-slate-50">
      <aside className="w-72 min-h-0 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Community</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Chat rooms</h2>
          </div>
          <button
            type="button"
            onClick={() => { setCreateOpen((open) => !open); setCreateError(''); setNotice(''); }}
            aria-expanded={createOpen}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {createOpen ? 'Cancel' : '+ Create'}
          </button>
        </div>

        {createOpen && (
          <form onSubmit={handleCreateRoom} className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <h3 className="font-semibold text-slate-900">Create a room</h3>
            <label htmlFor="room-name" className="mt-3 block text-sm font-medium text-slate-700">Room name</label>
            <input
              id="room-name"
              autoFocus
              required
              maxLength={255}
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="e.g. One Piece fans"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Private room
            </label>
            <p className="mt-1 pl-6 text-xs text-slate-500">{isPrivate ? 'Only invited members can join.' : 'Visible to everyone in the community.'}</p>
            {createError && <p role="alert" className="mt-3 text-sm text-rose-700">{createError}</p>}
            <button
              type="submit"
              disabled={saving || !roomName.trim()}
              className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create room'}
            </button>
          </form>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <form onSubmit={joinWithInviteCode} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <label htmlFor="invite-code" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Join with invite code</label>
          <div className="mt-2 flex gap-2">
            <input id="invite-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value)} maxLength={32} placeholder="Enter code" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-indigo-500" />
            <button type="submit" disabled={joining || !joinCode.trim()} className="rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-50">Join</button>
          </div>
          {joinError && <p role="alert" className="mt-2 text-xs text-rose-700">{joinError}</p>}
        </form>
        <div className="mt-5 space-y-1.5">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => { chooseRoom(room); setNotice(''); }}
              aria-current={activeRoom?.id === room.id ? 'true' : undefined}
              className={`w-full rounded-xl px-3.5 py-3 text-left transition ${activeRoom?.id === room.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium"># {room.name}</span>
                {room.is_private && <span className={`text-xs ${activeRoom?.id === room.id ? 'text-indigo-100' : 'text-slate-400'}`}>Private</span>}
              </span>
              <span className={`mt-1 block text-xs ${activeRoom?.id === room.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                {room.is_leader ? 'Room leader' : room.is_member ? `${room.member_count} members` : 'Public · join to chat'}
              </span>
            </button>
          ))}
        </div>
        {!error && rooms.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">No rooms yet. Create one and start a community conversation.</p>}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><h1 className="truncate text-xl font-bold text-slate-900">{activeRoom ? `# ${activeRoom.name}` : 'Choose a room'}</h1>
            {activeRoom && <p className="mt-1 text-sm text-slate-500">{activeRoom.is_private ? 'Private room' : 'Community room'} · {activeRoom.member_count} members</p>}</div>
            {activeRoom?.is_leader && <button type="button" onClick={() => void deleteActiveRoom()} className="shrink-0 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete room</button>}
          </div>
        </header>
        {activeRoom && !activeRoom.is_member ? <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl" aria-hidden="true">💬</div><h2 className="mt-5 text-lg font-bold text-slate-900">Join #{activeRoom.name}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Join this public room to read and send messages.</p>{joinError && <p role="alert" className="mt-3 text-sm text-rose-700">{joinError}</p>}<button type="button" disabled={joining} onClick={() => void joinActiveRoom()} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{joining ? 'Joining…' : 'Join room'}</button></div></div> : activeRoom ? <>
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-2 text-xs text-slate-500 sm:px-8">
            <span>{connection === 'connected' ? '● Live' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</span>
            <span>Messages refresh automatically</span>
          </div>
          {activeRoom.is_leader && <section className="max-h-48 shrink-0 overflow-y-auto border-b border-indigo-100 bg-indigo-50/60 px-5 py-3 sm:px-8">
            <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold text-slate-800">Room invite code</p><code className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-indigo-700">{management?.invite_code || 'Loading…'}</code><span className="text-xs text-slate-500">Visible to room leaders only</span></div>
            {managementError && <p role="alert" className="mt-2 text-sm text-rose-700">{managementError}</p>}
            {management && <div className="mt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Members · select people to make leaders</p><div className="flex flex-wrap gap-2">{management.members.filter((member) => member.role !== 'leader').map((member) => <label key={member.user_id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"><input type="checkbox" checked={selectedLeaders.includes(member.user_id)} onChange={(event) => setSelectedLeaders((current) => event.target.checked ? [...current, member.user_id] : current.filter((id) => id !== member.user_id))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />{member.username}</label>)}</div>
              {management.members.every((member) => member.role === 'leader') ? <p className="text-sm text-slate-500">All room members are leaders.</p> : <button type="button" disabled={managementSaving || selectedLeaders.length === 0} onClick={() => void promoteSelectedLeaders()} className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{managementSaving ? 'Saving…' : `Make leaders${selectedLeaders.length ? ` (${selectedLeaders.length})` : ''}`}</button>}
            </div>}
          </section>}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-8" aria-live="polite">
            {messages.length === 0 && <div className="flex h-full min-h-64 items-center justify-center"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl" aria-hidden="true">💬</div><p className="mt-4 font-semibold text-slate-800">No messages yet</p><p className="mt-1 text-sm text-slate-500">Start the conversation in this room.</p></div></div>}
            {messages.map((message) => {
              const ownMessage = String(message.sender_id) === currentUserId;
              return <article key={message.id} className={`flex gap-3 ${ownMessage ? 'flex-row-reverse' : ''}`}>
                <Link href={`/profile?id=${message.sender_id}`} title={`View ${message.sender_username}'s profile`} aria-label={`View ${message.sender_username}'s profile`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold uppercase text-white shadow-sm ring-2 ring-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {message.sender_username?.slice(0, 1) || '?'}
                </Link>
                <div className={`max-w-[min(75%,42rem)] ${ownMessage ? 'text-right' : ''}`}>
                  <div className={`mb-1 flex items-center gap-2 text-xs ${ownMessage ? 'justify-end' : ''}`}>
                    <Link href={`/profile?id=${message.sender_id}`} className="font-semibold text-slate-700 hover:text-indigo-600 hover:underline">{ownMessage ? 'You' : message.sender_username}</Link>
                    <time className="text-slate-400" dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                  <p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-left text-sm leading-6 ${ownMessage ? 'rounded-tr-md bg-indigo-600 text-white' : 'rounded-tl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'}`}>{message.content}</p>
                </div>
              </article>;
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4 sm:px-8 sm:py-5">
            {messageError && <p role="alert" className="mb-2 text-sm text-rose-700">{messageError}</p>}
            <div className="flex items-end gap-3">
              <label htmlFor="chat-message" className="sr-only">Write a message</label>
              <textarea id="chat-message" value={messageText} onChange={(event) => { setMessageText(event.target.value); localStorage.setItem(`chatDraft:${activeRoom.id}`, event.target.value); }} maxLength={4000} rows={1} placeholder={`Message #${activeRoom.name}`} className="max-h-36 min-h-12 flex-1 resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
              <button type="submit" disabled={sending || !messageText.trim()} className="h-12 rounded-2xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </form>
        </> : <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl" aria-hidden="true">💬</div><p className="mt-5 text-lg font-bold text-slate-900">Find your people</p><p className="mt-2 text-sm leading-6 text-slate-500">Choose an existing room or create one to start chatting.</p><button type="button" onClick={() => setCreateOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Create a room</button></div></div>}
      </main>
    </div>
  );
}
