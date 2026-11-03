import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, BadgeCheck, Compass, ExternalLink, Flag, Loader2, MessageCircle, Pencil, UserPlus, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";

function monthYear(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function avatar(size: "sm" | "lg") {
  return size === "lg" ? "size-20" : "size-11";
}

export default function PlayerProfile() {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<"harassment" | "hate-speech" | "scam" | "cheating" | "inappropriate-content" | "other">("harassment");
  const [reportText, setReportText] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const profile = useQuery(api.users.publicPlayerProfile, { username });
  const reportState = useQuery(api.moderation.reportState, profile?.username ? { username: profile.username } : "skip");
  const submitReport = useMutation(api.moderation.submitPlayerReport);
  const friendStatus = useQuery(api.users.friendStatus, { username });
  const friends = useQuery(api.users.publicFriendList, { username });
  const conversation = useQuery(api.users.playerConversation, friendStatus?.status === "friends" ? { username } : "skip");
  const sendFriendRequest = useMutation(api.users.sendFriendRequest);
  const respondToFriendRequest = useMutation(api.users.respondToFriendRequest);
  const removeFriend = useMutation(api.users.removeFriend);
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
      setMessage(accept ? "Friend request accepted." : "Friend request declined.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update friend request.");
    } finally {
      setBusy(false);
    }
  }

  async function removeConnection() {
    setBusy(true);
    setMessage("");
    try {
      await removeFriend({ username });
      setMessage("Connection removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove this connection.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReportBusy(true);
    setReportMessage("");
    try {
      await submitReport({ username, category: reportCategory, message: reportText });
      setReportText("");
      setReportOpen(false);
      setReportMessage("Report sent to the contact team. They review reports and can act on the account.");
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : "Could not send the report.");
    } finally {
      setReportBusy(false);
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
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/worlds" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#176b45]"><ArrowLeft className="size-4" /> Back to discovery</Link>
        {profile === undefined ? (
          <div role="status" className="mt-6 flex items-center gap-3 rounded border border-slate-200 bg-white p-5 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" /> Loading profile…</div>
        ) : profile === null ? (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">This profile isn’t available for public discovery.</p>
            <Link to="/worlds" className="mt-5 inline-block text-sm font-medium text-[#176b45] hover:underline">Search for another player</Link>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            <header className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start gap-5 border-b border-slate-100 bg-[#e8f3ec]/60 p-6 sm:p-8">
                {profile.image ? (
                  <img src={profile.image} alt="" className={`${avatar("lg")} shrink-0 rounded-full border border-slate-200 object-cover`} />
                ) : (
                  <span className={`${avatar("lg")} flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500`}><UserRound className="size-9" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{profile.displayName || profile.username || "OpenWorlds team member"}</h1>
                    {profile.isOfficialCreator && <BadgeCheck className="size-5 shrink-0 text-sky-600" aria-label="Official Content Creator" />}
                    {profile.isCompanyStaff && profile.publicBadge && <RoleBadge badge={profile.publicBadge} />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{profile.username ? `@${profile.username}` : "OpenWorlds company account"}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>Member since {monthYear(profile.memberSince)}</span>
                    {profile.hasPlayerAccount && <span>{profile.publishedWorldCount} published {profile.publishedWorldCount === 1 ? "world" : "worlds"}</span>}
                    {profile.friendCount !== null && <span>{profile.friendCount} {profile.friendCount === 1 ? "friend" : "friends"}</span>}
                  </p>
                </div>
                {profile.isSelf && <Button asChild variant="outline" size="sm"><Link to="/dashboard"><Pencil className="size-4" /> Edit profile</Link></Button>}
              </div>
              {profile.about ? (
                <div className="p-6 sm:p-8">
                  <h2 className="text-sm font-semibold">About</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{profile.about}</p>
                </div>
              ) : profile.isSelf ? (
                <div className="p-6 sm:p-8 text-sm text-slate-600">Add an about me, photo, and privacy settings from your <Link to="/dashboard" className="font-medium text-[#176b45] hover:underline">player hub</Link>.</div>
              ) : profile.isCompanyStaff ? (
                <div className="p-6 sm:p-8 text-sm text-slate-600">Public OpenWorlds team profile.</div>
              ) : null}
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="space-y-6">
                <section className="rounded border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-lg font-semibold"><Compass className="size-4 text-[#176b45]" /> Worlds</h2>
                    {profile.publishedWorldCount > 0 && <span className="text-xs text-slate-500">{profile.publishedWorldCount} published</span>}
                  </div>
                  {profile.publishedWorlds.length === 0 ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {profile.isSelf
                        ? "You haven’t published a world yet. Publish one from your player hub and it will show up here."
                        : "No worlds published yet."}
                    </p>
                  ) : (
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {profile.publishedWorlds.map((world) => (
                        <li key={world.id}>
                          <Link to={`/worlds/${world.id}`} className="flex h-full flex-col overflow-hidden rounded border border-slate-200 transition hover:border-[#176b45] hover:bg-slate-50">
                            {world.image ? <img src={world.image} alt="" loading="lazy" className="h-28 w-full object-cover" /> : <span className="flex h-28 items-center justify-center bg-[#e8f3ec] text-[#176b45]"><Compass className="size-7" /></span>}
                            <span className="flex flex-1 flex-col p-3">
                              <span className="font-medium">{world.title}</span>
                              {world.description && <span className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{world.description}</span>}
                              <span className="mt-auto pt-2 text-xs font-medium text-[#176b45]">View world →</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {profile.hasPlayerAccount && (
                  <section className="rounded border border-slate-200 bg-white p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="size-4 text-[#176b45]" /> Friends{profile.friendCount !== null ? ` · ${profile.friendCount}` : ""}</h2>
                    {!profile.friendsVisible ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500">This player keeps their friends list private.</p>
                    ) : friends === undefined ? (
                      <p className="mt-2 text-sm text-slate-500">Loading friends…</p>
                    ) : friends.length ? (
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {friends.map((friend) => (
                          <li key={friend.username}>
                            <Link to={`/players/${encodeURIComponent(friend.username)}`} className="flex items-center gap-3 rounded border border-slate-200 px-3 py-2 hover:bg-slate-50">
                              {friend.image ? <img src={friend.image} alt="" className={`${avatar("sm")} rounded-full object-cover`} /> : <span className={`${avatar("sm")} flex items-center justify-center rounded-full bg-slate-100 text-slate-500`}><UserRound className="size-5" /></span>}
                              <span className="min-w-0"><span className="block truncate text-sm font-medium">{friend.displayName || friend.username}</span><span className="block truncate text-xs text-slate-500">@{friend.username}</span></span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No friends to show yet.</p>
                    )}
                  </section>
                )}
              </div>

              <aside className="space-y-4 lg:sticky lg:top-6">
                {profile.hasPlayerAccount && !profile.isSelf && (
                  <section className="rounded border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-semibold">Connect</h2>
                    {!user ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to a player account to send a friend request and message {profile.username ? `@${profile.username}` : "this player"}.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button asChild size="sm"><Link to="/player-login">Player log in</Link></Button>
                          <Button asChild size="sm" variant="outline"><Link to="/player-signup">Create account</Link></Button>
                        </div>
                      </>
                    ) : !user.playerUsername ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Choose your public username in the player hub to send friend requests and messages.</p>
                        <Button asChild size="sm" variant="outline" className="mt-4"><Link to="/dashboard">Open player hub</Link></Button>
                      </>
                    ) : friendStatus === undefined ? (
                      <p className="mt-2 text-sm text-slate-500">Checking connection…</p>
                    ) : friendStatus.status === "unavailable" ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">This player isn’t available for friend requests right now.</p>
                    ) : friendStatus.status === "none" ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Send a friend request. You can message each other once it’s accepted.</p>
                        <Button type="button" className="mt-4" size="sm" disabled={busy} onClick={() => void addFriend()}><UserPlus className="size-4" /> Add friend</Button>
                      </>
                    ) : friendStatus.status === "outgoing" ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Friend request sent. You’ll be able to message once they accept.</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button type="button" variant="outline" size="sm" disabled>Request sent</Button>
                          <button type="button" disabled={busy} onClick={() => void removeConnection()} className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">Cancel request</button>
                        </div>
                      </>
                    ) : friendStatus.status === "incoming" ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-600">This player would like to connect with you.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button type="button" size="sm" disabled={busy} onClick={() => void replyToRequest(true)}>Accept request</Button>
                          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void replyToRequest(false)}>Decline</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 inline-flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"><Users className="size-4" /> Friends</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">You can message each other below.</p>
                        <button type="button" disabled={busy} onClick={() => void removeConnection()} className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">Remove friend</button>
                      </>
                    )}
                    {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
                  </section>
                )}

                {friendStatus?.status === "friends" && (
                  <section className="rounded border border-slate-200 bg-white p-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="size-4 text-[#176b45]" /> Messages</h2>
                    <p className="mt-1 text-xs text-slate-500">Friends only · last 100 messages</p>
                    <div className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
                      {conversation?.messages.map((item, index) => (
                        <p key={`${item.createdAt}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded px-3 py-2 text-sm ${item.sentByMe ? "ml-auto bg-emerald-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>
                          <span className="mb-1 block text-[10px] font-medium text-slate-500">{item.sentByMe ? "You" : profile.displayName || profile.username}</span>
                          {item.body}
                          <span className="mt-1 block text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                        </p>
                      ))}
                      {conversation && conversation.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>}
                      {conversation === null && <p className="text-sm text-slate-500">Conversation unavailable.</p>}
                    </div>
                    <form onSubmit={sendMessage} className="mt-3 space-y-2">
                      <Input value={messageBody} onChange={(event) => setMessageBody(event.target.value)} maxLength={2000} aria-label="Message" placeholder="Write a message…" required />
                      <Button type="submit" size="sm" disabled={busy || !messageBody.trim()}>Send message</Button>
                    </form>
                  </section>
                )}

                <section className="rounded border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-semibold">Details</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">Username</dt><dd className="truncate font-medium">{profile.username ? `@${profile.username}` : "Company account"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">Member since</dt><dd>{monthYear(profile.memberSince)}</dd></div>
                    {profile.hasPlayerAccount && <div className="flex justify-between gap-3"><dt className="text-slate-500">Worlds</dt><dd>{profile.publishedWorldCount}</dd></div>}
                    {profile.friendCount !== null && <div className="flex justify-between gap-3"><dt className="text-slate-500">Friends</dt><dd>{profile.friendCount}</dd></div>}
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">Account</dt><dd>{profile.isCompanyStaff ? "OpenWorlds team" : "Player"}</dd></div>
                  </dl>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                    {profile.socialUrl && <a href={profile.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-[#176b45] hover:underline">{profile.socialPlatform || "Social profile"}<ExternalLink className="size-4" /></a>}
                    {profile.isCompanyStaff && <Link to="/careers" className="block font-medium text-[#176b45] hover:underline">Open roles at OpenWorlds</Link>}
                    <Link to="/support" className="block text-slate-600 hover:text-[#176b45] hover:underline">Contact support</Link>
                    {profile.username && !profile.isSelf && reportState?.canReport && !reportState.reported && (
                      <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center gap-2 text-slate-500 hover:text-[#b42318] hover:underline">
                        <Flag className="size-4" /> Report this player
                      </button>
                    )}
                    {reportState?.reported && <p className="text-xs text-slate-500">Report under review by the contact team.</p>}
                    {profile.username && !profile.isSelf && reportState && !reportState.signedIn && <p className="text-xs text-slate-500"><Link to="/player-login" className="font-medium text-[#176b45] hover:underline">Sign in</Link> to report this player.</p>}
                  </div>
                  {reportMessage && <p role="status" className="mt-3 text-sm text-slate-600">{reportMessage}</p>}
                </section>
              </aside>
            </div>
          </div>
        )}
      </section>

      <Dialog open={reportOpen} onOpenChange={(open) => { setReportOpen(open); if (!open) setReportMessage(""); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report @{profile?.username}</DialogTitle>
            <DialogDescription>Reports go to the OpenWorlds contact team. Only staff and admins reviewing reports can see this.</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendReport} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="report-category" className="text-sm font-medium">What happened?</label>
              <select id="report-category" value={reportCategory} onChange={(event) => setReportCategory(event.target.value as typeof reportCategory)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="harassment">Harassment or threats</option>
                <option value="hate-speech">Hate speech</option>
                <option value="scam">Scam or fraud</option>
                <option value="cheating">Cheating or exploits</option>
                <option value="inappropriate-content">Inappropriate content</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="report-details" className="text-sm font-medium">Details</label>
              <Textarea id="report-details" rows={5} minLength={20} maxLength={1500} required value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder="What happened, when, and where? Include links or message text if it helps." />
              <p className="text-xs text-slate-500">False reports can also lead to action on your account.</p>
            </div>
            {reportMessage && <p role="alert" className="text-sm text-[#b42318]">{reportMessage}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={reportBusy || reportText.trim().length < 20}>{reportBusy ? "Sending…" : "Send report"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
