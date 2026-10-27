import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, BadgeCheck, ExternalLink, Loader2, MessageCircle, UserPlus, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";

export default function PlayerProfile() {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const profile = useQuery(api.users.publicPlayerProfile, { username });
  const friendStatus = useQuery(api.users.friendStatus, { username });
  const friends = useQuery(api.users.publicFriendList, { username });
  const conversation = useQuery(api.users.playerConversation, friendStatus?.status === "friends" ? { username } : "skip");
  const sendFriendRequest = useMutation(api.users.sendFriendRequest);
  const respondToFriendRequest = useMutation(api.users.respondToFriendRequest);
  const sendPlayerMessage = useMutation(api.users.sendPlayerMessage);

  async function addFriend() {
    setBusy(true);
    setMessage("");
    try {
      await sendFriendRequest({ username });
      setMessage("Friend request sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send friend request.");
    } finally {
      setBusy(false);
    }
  }

  async function replyToRequest(accept: boolean) {
    if (!friendStatus || !("requestId" in friendStatus) || !friendStatus.requestId) return;
    setBusy(true);
    try {
      await respondToFriendRequest({ requestId: friendStatus.requestId, accept });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update friend request.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await sendPlayerMessage({ username, body: messageBody });
      setMessageBody("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/worlds" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#176b45]"><ArrowLeft className="size-4" /> Back to discovery</Link>
        {profile === undefined ? (
          <div role="status" className="mt-6 flex items-center gap-3 rounded border border-slate-200 bg-white p-5 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" /> Loading profile…</div>
        ) : profile === null ? (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">This profile isn’t available for public discovery.</p>
          </section>
        ) : (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-4">
              {profile.image ? <img src={profile.image} alt="" className="size-16 rounded-full border border-slate-200 object-cover" /> : <span className="flex size-16 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500"><UserRound className="size-7" /></span>}
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">{profile.displayName || profile.username}{profile.isOfficialCreator && <BadgeCheck className="size-5 shrink-0 text-sky-600" aria-label="Official Content Creator" />}</h1>
                <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
              </div>
            </div>
            {profile.socialUrl && <a href={profile.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm font-medium text-[#176b45] hover:bg-slate-50">{profile.socialPlatform || "Social profile"}<ExternalLink className="size-4" /></a>}
            {profile.about && <div className="mt-6 border-t border-slate-100 pt-5"><h2 className="text-sm font-semibold">About me</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{profile.about}</p></div>}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4" /> Friends{profile.friendsVisible && profile.friendCount !== null ? ` · ${profile.friendCount}` : ""}</h2>
              {!profile.friendsVisible ? <p className="mt-2 text-sm text-slate-500">This player keeps their friends list private.</p> : friends === undefined ? <p className="mt-2 text-sm text-slate-500">Loading friends…</p> : friends.length ? <ul className="mt-3 flex flex-wrap gap-3">{friends.map((friend) => <li key={friend.username}><Link to={`/players/${encodeURIComponent(friend.username)}`} className="flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{friend.image ? <img src={friend.image} alt="" className="size-8 object-cover" /> : <span className="size-8 bg-slate-100" />}<span>{friend.displayName || friend.username}<span className="block text-xs text-slate-500">@{friend.username}</span></span></Link></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No friends to show yet.</p>}
            </div>
            {user?.role === "user" && friendStatus && !["self", "unavailable", "signed-out"].includes(friendStatus.status) && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex flex-wrap gap-2">
                  {friendStatus.status === "none" && <Button type="button" disabled={busy} onClick={() => void addFriend()}><UserPlus className="size-4" /> Add friend</Button>}
                  {friendStatus.status === "outgoing" && <Button type="button" variant="outline" disabled>Request sent</Button>}
                  {friendStatus.status === "incoming" && <><Button type="button" disabled={busy} onClick={() => void replyToRequest(true)}>Accept request</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void replyToRequest(false)}>Decline</Button></>}
                  {friendStatus.status === "friends" && <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"><Users className="size-4" /> Friends</span>}
                </div>
                {friendStatus.status === "friends" && (
                  <div className="mt-5 border border-slate-200 p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="size-4" /> Messages · friends only</h2>
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto" aria-live="polite">
                      {conversation?.messages.map((item, index) => <p key={`${item.createdAt}-${index}`} className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm ${item.sentByMe ? "ml-auto bg-emerald-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>{item.body}<span className="mt-1 block text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></p>)}
                      {conversation && conversation.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>}
                      {conversation === null && <p className="text-sm text-slate-500">Conversation unavailable.</p>}
                    </div>
                    <form onSubmit={sendMessage} className="mt-3 flex gap-2"><Input value={messageBody} onChange={(event) => setMessageBody(event.target.value)} maxLength={2000} aria-label="Message" placeholder="Write a message…" required /><Button type="submit" disabled={busy || !messageBody.trim()}>Send</Button></form>
                  </div>
                )}
                {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
              </div>
            )}
            {!user && <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500"><Link to="/player-login" className="font-medium text-[#176b45] hover:underline">Sign in</Link> to send a friend request.</p>}
          </section>
        )}
      </section>
    </main>
  );
}
