import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, Inbox as InboxIcon, Loader2, MessageCircle, Send, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav } from "@/components/SiteNav";

function timeAgo(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type InboxEntry = {
  requestId: Id<"friendRequests">;
  createdAt: number;
  username: string;
  displayName: string | null;
  image: string | null;
  presence: "in-game" | "online" | "offline";
};

type Conversation = {
  username: string;
  displayName: string | null;
  image: string | null;
  presence: "in-game" | "online" | "offline";
  lastActivityAt: number;
  lastMessage: { body: string; sentByMe: boolean; createdAt: number } | null;
};

function PersonLine({ entry }: { entry: InboxEntry }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {entry.image ? (
        <img src={entry.image} alt="" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" />
      ) : (
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">
          {(entry.displayName || entry.username).slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <Link to={`/players/${encodeURIComponent(entry.username)}`} className="block truncate font-medium text-slate-900 hover:text-[#176b45] hover:underline">
          {entry.displayName || `@${entry.username}`}
        </Link>
        <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
          <span className={`size-2 rounded-full ${entry.presence === "in-game" ? "bg-sky-500" : entry.presence === "online" ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" />
          @{entry.username}
          {entry.presence === "in-game" ? " · in game" : entry.presence === "online" ? " · online" : ""}
        </p>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { user } = useAuth();
  const inbox = useQuery(api.users.myInbox, user ? {} : "skip");
  const respond = useMutation(api.users.respondToFriendRequest);
  const cancel = useMutation(api.users.removeFriend);
  const sendPlayerMessage = useMutation(api.users.sendPlayerMessage);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [threadMessage, setThreadMessage] = useState("");
  const [sending, setSending] = useState(false);
  const conversation = useQuery(
    api.users.playerConversation,
    selectedUsername ? { username: selectedUsername } : "skip",
  );

  async function decide(entry: InboxEntry, accept: boolean) {
    setBusyId(entry.requestId);
    setMessage("");
    try {
      await respond({ requestId: entry.requestId, accept });
      setMessage(accept ? `You are now friends with @${entry.username}.` : `Declined @${entry.username}'s friend request.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this friend request.");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelRequest(entry: InboxEntry) {
    setBusyId(entry.requestId);
    setMessage("");
    try {
      await cancel({ username: entry.username });
      setMessage(`Cancelled your request to @${entry.username}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not cancel this friend request.");
    } finally {
      setBusyId(null);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUsername || !messageBody.trim()) return;
    setSending(true);
    setThreadMessage("");
    try {
      await sendPlayerMessage({ username: selectedUsername, body: messageBody });
      setMessageBody("");
    } catch (error) {
      setThreadMessage(error instanceof Error ? error.message : "Could not send this message.");
    } finally {
      setSending(false);
    }
  }

  function openConversation(username: string) {
    setSelectedUsername(username);
    setMessageBody("");
    setThreadMessage("");
  }

  const requests = (inbox && !inbox.needsUsername ? inbox.requests : []) as InboxEntry[];
  const sent = (inbox && !inbox.needsUsername ? inbox.sent : []) as InboxEntry[];
  const conversations = (inbox && !inbox.needsUsername ? inbox.conversations : []) as Conversation[];
  const selectedConversation = conversations.find((entry) => entry.username === selectedUsername) ?? null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#176b45]"><InboxIcon className="size-4" /> Player inbox</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Messages, friend requests, and updates about your connections appear here. Only you and the other person can see them.</p>
          </div>
          {requests.length > 0 && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">{requests.length} waiting</span>}
        </div>

        {inbox === undefined ? (
          <p role="status" className="mt-8 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading your inbox…</p>
        ) : inbox === null ? (
          <p className="mt-8 text-sm text-slate-500">Sign in to see your inbox.</p>
        ) : inbox.needsUsername ? (
          <section className="mt-8 rounded border border-amber-200 bg-amber-50/60 p-6">
            <h2 className="font-semibold">Choose a public username first</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Messages and friend requests need a public username so other players can find and contact you. Choose one in your player hub.</p>
            <Button asChild className="mt-4" size="sm"><Link to="/dashboard">Open player hub</Link></Button>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            {message && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold"><MessageCircle className="size-4 text-[#176b45]" /> Messages</h2>
                  <p className="mt-1 text-xs text-slate-500">Private conversations with accepted friends</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {conversations.length} {conversations.length === 1 ? "friend" : "friends"}
                </span>
              </div>

              {conversations.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <MessageCircle className="mx-auto size-7 text-slate-300" />
                  <p className="mt-3 font-medium text-slate-800">No conversations yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">Accept a friend request, then you can message each other here or from a player profile.</p>
                  <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/worlds">Find players</Link></Button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <div className="max-h-[28rem] overflow-y-auto border-b border-slate-100 lg:border-b-0 lg:border-r">
                    {conversations.map((entry) => {
                      const active = selectedUsername === entry.username;
                      return (
                        <button
                          key={entry.username}
                          type="button"
                          onClick={() => openConversation(entry.username)}
                          aria-pressed={active}
                          className={`flex w-full items-start gap-3 border-b border-l-2 px-4 py-3 text-left transition last:border-b-0 ${active ? "border-l-[#176b45] bg-[#f1f8f3]" : "border-l-transparent hover:bg-slate-50"}`}
                        >
                          {entry.image ? (
                            <img src={entry.image} alt="" className="size-10 shrink-0 rounded-full border border-slate-200 object-cover" />
                          ) : (
                            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">
                              {(entry.displayName || entry.username).slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm font-medium text-slate-900">{entry.displayName || `@${entry.username}`}</span>
                              <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(entry.lastActivityAt)}</span>
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                              <span className={`size-1.5 shrink-0 rounded-full ${entry.presence === "in-game" ? "bg-sky-500" : entry.presence === "online" ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" />
                              <span className="truncate">
                                {entry.lastMessage
                                  ? `${entry.lastMessage.sentByMe ? "You: " : ""}${entry.lastMessage.body}`
                                  : `@${entry.username} · start a conversation`}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex min-h-[18rem] flex-col">
                    {!selectedUsername ? (
                      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                        <MessageCircle className="size-7 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">Select a conversation</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Choose a friend from the list to read and reply.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{selectedConversation?.displayName || `@${selectedUsername}`}</p>
                            <p className="truncate text-xs text-slate-500">@{selectedUsername}</p>
                          </div>
                          <Link to={`/players/${encodeURIComponent(selectedUsername)}`} className="shrink-0 text-xs font-medium text-[#176b45] hover:underline">
                            View profile
                          </Link>
                        </div>
                        <div className="max-h-72 min-h-36 flex-1 space-y-2 overflow-y-auto bg-slate-50/60 p-4" aria-live="polite">
                          {conversation === undefined ? (
                            <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading conversation…</p>
                          ) : conversation === null ? (
                            <p className="text-sm text-slate-500">This conversation is unavailable.</p>
                          ) : conversation.messages.length === 0 ? (
                            <p className="text-sm text-slate-500">No messages yet. Say hello below.</p>
                          ) : (
                            conversation.messages.map((item, index) => (
                              <div key={`${item.createdAt}-${index}`} className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${item.sentByMe ? "ml-auto bg-[#176b45] text-white" : "bg-white text-slate-800 shadow-sm"}`}>
                                <p className="whitespace-pre-wrap">{item.body}</p>
                                <p className={`mt-1 text-[10px] ${item.sentByMe ? "text-emerald-100" : "text-slate-400"}`}>{new Date(item.createdAt).toLocaleString()}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <form onSubmit={(event) => void sendMessage(event)} className="border-t border-slate-100 p-3">
                          <div className="flex items-center gap-2">
                            <Input value={messageBody} onChange={(event) => setMessageBody(event.target.value)} maxLength={2000} aria-label="Message" placeholder="Write a message…" />
                            <Button type="submit" size="icon" disabled={sending || !messageBody.trim()} aria-label="Send message">
                              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                          </div>
                          {threadMessage && <p role="status" className="mt-2 text-xs text-red-700">{threadMessage}</p>}
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold"><UserPlus className="size-4 text-[#176b45]" /> Friend requests</h2>
                <span className="text-xs text-slate-500">{requests.length} pending</span>
              </div>
              {requests.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-medium text-slate-800">No new friend requests</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">When another player asks to connect, they’ll show up here with accept and decline options.</p>
                  <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/worlds">Find players</Link></Button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {requests.map((entry) => (
                    <li key={entry.requestId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1"><PersonLine entry={entry} /></div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">{timeAgo(entry.createdAt)}</span>
                        <Button type="button" size="sm" disabled={busyId === entry.requestId} onClick={() => void decide(entry, true)}>{busyId === entry.requestId ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Accept</Button>
                        <Button type="button" size="sm" variant="outline" disabled={busyId === entry.requestId} onClick={() => void decide(entry, false)}><X className="size-4" /> Decline</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold"><Clock className="size-4 text-slate-500" /> Requests you sent</h2>
                <span className="text-xs text-slate-500">{sent.length} waiting</span>
              </div>
              {sent.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">You have no pending requests. Open a player’s profile to add them.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {sent.map((entry) => (
                    <li key={entry.requestId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1"><PersonLine entry={entry} /></div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">Sent {timeAgo(entry.createdAt)}</span>
                        <Button type="button" size="sm" variant="outline" disabled={busyId === entry.requestId} onClick={() => void cancelRequest(entry)}>{busyId === entry.requestId ? <Loader2 className="size-4 animate-spin" /> : null} Cancel request</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-center text-xs text-slate-500">Manage whether people can send you requests in your <Link to="/dashboard" className="font-medium text-[#176b45] hover:underline">player hub</Link>.</p>
          </div>
        )}
      </section>
    </main>
  );
}
