import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { BadgeCheck, ExternalLink, Loader2, Mail, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CreatorVerification() {
  const status = useQuery(api.adminRoster.creatorRosterStatus);
  const requestCode = useAction(api.adminRoster.requestCreatorCode);
  const verifyCode = useMutation(api.adminRoster.verifyCreatorCode);
  const saveCreator = useMutation(api.users.saveOfficialCreator);
  const removeCreator = useMutation(api.users.removeOfficialCreator);
  const [now, setNow] = useState(Date.now());
  const creators = useQuery(api.users.staffOfficialCreators, status?.canManage && (status.verifiedUntil ?? 0) > now ? {} : "skip");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const deferredPlayerSearch = useDeferredValue(playerSearch.trim().replace(/^@/, ""));
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const verified = Boolean(status?.canManage && (status.verifiedUntil ?? 0) > now);
  const matchingPlayers = useQuery(
    api.users.searchPlayersForCreatorVerification,
    verified && deferredPlayerSearch.length >= 2 ? { search: deferredPlayerSearch } : "skip",
  );

  useEffect(() => {
    if (!status?.verifiedUntil || status.verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setNow(Date.now()), status.verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [status?.verifiedUntil]);

  async function sendCode() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestCode({});
      setNotice("A six-digit verification code was sent to support@openworlds.dk. It expires in 10 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the Support verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await verifyCode({ code });
      if (!result.ok) throw new Error(result.message);
      setCode("");
      setNow(Date.now());
      setNotice("Verified. Creator approvals are enabled for 15 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the Support code.");
    } finally {
      setBusy(false);
    }
  }

  async function approveCreator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await saveCreator({ email, username, displayName, socialPlatform, socialUrl });
      if (!result.linkedToAccount) throw new Error("No Creator access was granted. Confirm that this player has verified the recovery email entered here and that it matches their username exactly.");
      setEmail("");
      setUsername("");
      setDisplayName("");
      setSocialPlatform("");
      setSocialUrl("");
      setFormOpen(false);
      setPlayerSearch("");
      setNotice("Creator verified. Their player account now has Creator Space access, and their profile appears in the public creator listing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this creator.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeCreator(creatorId: Id<"officialCreators">) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await removeCreator({ creatorId });
      setNotice("Creator access, badge, and public listing removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this creator.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100"><BadgeCheck className="size-4" /> Staff tools</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Creator verification</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-blue-50">Review a creator’s player account and public profiles. A one-time Support email code is required before granting verified status.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-5 px-5 py-8 sm:px-8 sm:py-10">
        {status === undefined ? (
          <div role="status" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" /> Checking staff access…</div>
        ) : !status.canManage ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Verified staff access required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with an approved, email-verified OpenWorlds staff or administrator account to manage creator verification.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/auth?returnTo=%2Fstaff%2Fcreators">Staff sign in</Link></Button>
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800"><ShieldCheck className="size-5" /></span>
                <div><h2 className="font-semibold">Support verification</h2><p className="mt-1 text-sm leading-6 text-slate-600">Request the code from support@openworlds.dk and enter it here. It expires after 10 minutes; approval access lasts 15 minutes.</p></div>
              </div>
              <Button className="mt-4" variant="outline" disabled={busy || verified} onClick={() => void sendCode()}><Mail className="size-4" />{busy ? "Sending code…" : verified ? "Creator approvals verified" : "Send code to Support"}</Button>
              {!verified && <form onSubmit={(event) => void confirmCode(event)} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><Label htmlFor="staff-creator-support-code">6-digit Support code</Label><Input id="staff-creator-support-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div><Button type="submit" disabled={busy || code.length !== 6}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Verify code</Button></form>}
              {verified && (
                <div className="mt-5 space-y-3">
                  <Button onClick={() => { setError(""); setFormOpen(true); }}><BadgeCheck className="size-4" /> Verify a creator</Button>
                  <div className="max-w-xl">
                    <Label htmlFor="creator-player-search">Find a player by username or name</Label>
                    <Input id="creator-player-search" className="mt-2" value={playerSearch} onChange={(event) => setPlayerSearch(event.target.value)} placeholder="Search usernames or display names…" autoComplete="off" />
                    {deferredPlayerSearch.length >= 2 && (
                      <div className="mt-2" aria-live="polite">
                        {matchingPlayers === undefined ? (
                          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Searching player accounts…</p>
                        ) : matchingPlayers.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">No matching player accounts found.</p>
                        ) : (
                          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                            {matchingPlayers.map((player) => (
                              <li key={player.username}>
                                <button type="button" onClick={() => { setUsername(player.username); setDisplayName(player.displayName || player.username); setFormOpen(true); }} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50">
                                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-medium text-slate-900">{player.displayName || player.username}{player.exact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Exact match</span>}{player.isOfficialCreator && <BadgeCheck className="size-4 shrink-0 text-sky-600" aria-label="Official Content Creator" />}</span><span className="block truncate text-xs text-slate-500">@{player.username}</span></span>
                                  <span className="shrink-0 text-xs font-medium text-[#0066cc]">Select</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {notice && <p role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
              {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            </section>

            {verified && <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Verified creator roster</h2><p className="mt-1 text-sm text-slate-600">Verified accounts receive Creator Space access and appear in the public scrolling creator list.</p></div><Button asChild variant="outline"><Link to="/community">View public creator list <ExternalLink className="size-4" /></Link></Button></div>
              {creators === undefined ? <p className="mt-5 text-sm text-slate-500">Loading approved creators…</p> : creators.length === 0 ? <p className="mt-5 text-sm text-slate-500">No approved creators yet.</p> : <div className="mt-5 space-y-3">{creators.map((creator) => <article key={creator._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><div><p className="flex items-center gap-2 font-medium">{creator.displayName}<BadgeCheck className="size-4 text-sky-600" /></p><p className="mt-1 text-sm text-slate-600">@{creator.username} · {creator.socialPlatform || "Social profile"} · {creator.isLinked ? "Linked player account" : "Not linked to account"}</p>{creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[#0066cc] underline">Open social profile <ExternalLink className="size-3" /></a>}</div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void revokeCreator(creator._id)}>Remove verification</Button></article>)}</div>}
            </section>}

            <div className="flex flex-wrap gap-3"><Button asChild variant="ghost"><Link to="/staff">Back to staff workspace</Link></Button><Button asChild variant="ghost"><Link to="/creators">Open Creator Space</Link></Button></div>
          </>
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!busy) setFormOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Verify an OpenWorlds creator</DialogTitle><DialogDescription>Enter the player’s verified account identity and public creator details. The account email must already be verified as the recovery email on their OpenWorlds player account.</DialogDescription></DialogHeader>
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-5 text-blue-900">If you selected a player from search, their username and public name are filled in. For privacy, search does not reveal their recovery email. Enter the exact recovery email already verified on that same player account; mismatched or unverified details will not grant Creator access.</p>
          <form id="creator-verification-form" onSubmit={(event) => void approveCreator(event)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="verify-player-username">OpenWorlds username</Label><Input id="verify-player-username" required minLength={2} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Their game username" /></div>
            <div className="space-y-2"><Label htmlFor="verify-player-email">Verified account recovery email</Label><Input id="verify-player-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email verified on their player account" /></div>
            <div className="space-y-2"><Label htmlFor="verify-public-name">Public creator name</Label><Input id="verify-public-name" required minLength={2} maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Name for the public creator list" /></div>
            <div className="space-y-2"><Label htmlFor="verify-social-platform">Social platform</Label><Input id="verify-social-platform" required maxLength={40} value={socialPlatform} onChange={(event) => setSocialPlatform(event.target.value)} placeholder="YouTube, Twitch, TikTok…" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="verify-social-url">Social profile link</Label><Input id="verify-social-url" type="url" required maxLength={500} value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} placeholder="https://…" /></div>
          </form>
          <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" form="creator-verification-form" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />} Grant verified Creator access</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Staff creator verification</footer>
    </main>
  );
}
