import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, Inbox as InboxIcon, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  const requests = (inbox && !inbox.needsUsername ? inbox.requests : []) as InboxEntry[];
  const sent = (inbox && !inbox.needsUsername ? inbox.sent : []) as InboxEntry[];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#176b45]"><InboxIcon className="size-4" /> Inbox</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Friend requests and updates about your connections appear here. Only you and the other person can see them.</p>
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
            <p className="mt-2 text-sm leading-6 text-slate-700">Friend requests need a public username so other players can find you. Choose one in your player hub.</p>
            <Button asChild className="mt-4" size="sm"><Link to="/dashboard">Open player hub</Link></Button>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            {message && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}

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
