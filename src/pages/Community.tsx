import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { CareerEnquiryDialog } from "@/components/CareerEnquiryDialog";
import { api } from "@/convex/_generated/api";
import { useQuery, useAction, useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { BadgeCheck, Heart, Lightbulb, LockKeyhole, ShieldCheck, Users, Youtube, ArrowRight, ExternalLink, Sparkles, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const guidelines = [
  { title: "Respect & kindness", description: "Treat all community members with respect. Harassment, discrimination, and hateful content have no place here.", icon: Heart },
  { title: "Privacy & security", description: "Protect your personal information and respect other people's privacy. Never share or request sensitive details.", icon: LockKeyhole },
  { title: "Original content", description: "Create original work and respect intellectual property. Do not repost content without permission.", icon: Lightbulb },
  { title: "Safety first", description: "Help keep community spaces safe. Report harmful content and follow community rules.", icon: ShieldCheck },
];

export default function Community() {
  const officialCreators = useQuery(api.users.publicOfficialCreators);
  const creatorStatus = useQuery(api.adminRoster.creatorRosterStatus);
  const requestCreatorCode = useAction(api.adminRoster.requestCreatorCode);
  const verifyCreatorCode = useMutation(api.adminRoster.verifyCreatorCode);
  const creators = officialCreators ?? [];
  const creatorLoop = creators.length > 0 ? [...creators, ...creators] : creators;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verificationClock, setVerificationClock] = useState(Date.now());
  const canManageCreators = Boolean(creatorStatus?.canManage);
  const creatorVerified = Boolean(canManageCreators && (creatorStatus?.verifiedUntil ?? 0) > verificationClock);

  useEffect(() => {
    const verifiedUntil = creatorStatus?.verifiedUntil ?? 0;
    if (!verifiedUntil || verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setVerificationClock(Date.now()), verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [creatorStatus?.verifiedUntil]);

  async function sendCode() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await requestCreatorCode({});
      setMessage("A six-digit approval code was sent to support@openworlds.dk. It expires in 10 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the Support verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await verifyCreatorCode({ code });
      if (!result.ok) throw new Error(result.message);
      setCode("");
      setMessage("Verified. Creator approvals are enabled for 15 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">The OpenWorlds community</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Community links</h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-blue-50">Official external channels and general community guidelines.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">External channels</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">These links lead to third-party services. Their availability and content are managed outside this website.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]"><Users className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">Discord</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed Discord invite. Community activity and support availability are managed on Discord.</p>
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">Join Discord</a>
          </article>
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]"><Youtube className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">YouTube</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed YouTube channel.</p>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg border border-violet-200 bg-violet-50/40 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Visit YouTube</a>
          </article>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Community guidelines</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">General guidance for interactions in OpenWorlds community spaces.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guidelines.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className="size-6 text-[#0066cc]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-medium text-[#7651c9]">Create with OpenWorlds</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">OpenWorlds Creator Program</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A home for creators making videos, streams, guides, art, and community stories around OpenWorlds. Approved creators are listed here with a verified badge; applying does not grant official status.</p>
            </div>
            <CareerEnquiryDialog label="Apply to the program" mode="creator-application" />
          </div>
          {canManageCreators && <CreatorReviewPanel
            verified={creatorVerified}
            busy={busy}
            code={code}
            error={error}
            message={message}
            setCode={setCode}
            onSendCode={sendCode}
            onVerify={verifyCode}
          />}

          <div className="mt-10 border-t border-slate-200 pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Meet the official creators</h3>
                <p className="mt-1 text-sm text-slate-600">Creators reviewed and approved by the OpenWorlds team.</p>
              </div>
              {creators.length > 0 && <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{creators.length} {creators.length === 1 ? "creator" : "creators"}</span>}
            </div>
            {officialCreators === undefined ? (
              <p className="mt-5 text-sm text-slate-500">Loading official creators…</p>
            ) : creators.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-600">No Official Content Creators yet. Approved creators will appear here.</p>
            ) : (
              <div className="creator-marquee mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 py-4" aria-label="Official Content Creators, scrolling automatically">
                <div className="creator-marquee-track flex w-max gap-4 px-4">
                  {creatorLoop.map((creator, index) => (
                    <div key={`${creator.username}-${index}`} aria-hidden={index >= creators.length} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      {creator.image ? (
                        <img src={creator.image} alt="" loading="lazy" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">{creator.username.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{creator.displayName}</span><span className="block truncate text-xs text-slate-500">@{creator.username}</span></span>
                      {creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" title={`Visit ${creator.displayName} on ${creator.socialPlatform || "their social profile"}`} className="shrink-0 text-slate-500 hover:text-[#176b45]"><ExternalLink className="size-4" aria-label="Open creator social profile" /></a>}
                      <span title="Verified Official Content Creator" className="shrink-0 text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {[
              { icon: Sparkles, title: "Make it yours", text: "Create videos, streams, artwork, tutorials, or other original OpenWorlds content." },
              { icon: BadgeCheck, title: "Get recognized", text: "Approved members receive the official creator badge and a public profile on this page." },
              { icon: Users, title: "Grow together", text: "Help new players discover the project and connect with the wider community." },
            ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5"><Icon className="size-5 text-[#176b45]" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#104b35] p-6 text-white sm:p-8">
            <div><h3 className="text-xl font-semibold">Interested in creating with us?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">Send the Careers team your OpenWorlds username, creator links, and a little about what you’d like to make.</p></div>
            <CareerEnquiryDialog label="Start an application" mode="creator-application" variant="outline" />
          </div>
        </div>
      </section>
      <footer className="px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}

function CreatorReviewPanel({
  verified,
  busy,
  code,
  error,
  message,
  setCode,
  onSendCode,
  onVerify,
}: {
  verified: boolean;
  busy: boolean;
  code: string;
  error: string;
  message: string;
  setCode: (value: string) => void;
  onSendCode: () => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const creators = useQuery(api.users.staffOfficialCreators, verified ? {} : "skip");
  const saveCreator = useMutation(api.users.saveOfficialCreator);
  const removeCreator = useMutation(api.users.removeOfficialCreator);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      const result = await saveCreator({ email, username, displayName, socialPlatform, socialUrl });
      setEmail("");
      setUsername("");
      setDisplayName("");
      setSocialPlatform("");
      setSocialUrl("");
      setActionMessage(result.linkedToAccount
        ? "Creator verified and linked to the player account. The badge and scrolling directory listing are now active."
        : "The creator could not be linked to a verified player account.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not verify this creator.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCreatorEntry(creatorId: Id<"officialCreators">) {
    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      await removeCreator({ creatorId });
      setActionMessage("Creator badge and public listing removed.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not remove this creator.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-800"><ShieldCheck className="size-5" /></span>
          <div><h3 className="font-semibold">Staff creator verification</h3><p className="mt-1 text-sm leading-6 text-slate-600">Admins and approved staff can grant verified status after reviewing a creator's public name, OpenWorlds username, account email, and social profile. A code from Support is required. Applications are not automatically approved.</p></div>
        </div>
        <Button asChild variant="outline"><Link to="/staff/creators">Open creator verification page</Link></Button>
      </div>
      <Button className="mt-4" variant="outline" disabled={busy || verified} onClick={() => void onSendCode()}><Mail className="size-4" />{busy ? "Sending code…" : verified ? "Creator controls verified" : "Send code to Support"}</Button>
      {!verified && <form onSubmit={onVerify} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><Label htmlFor="community-creator-code">6-digit Support code</Label><Input id="community-creator-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div><Button type="submit" disabled={busy || code.length !== 6}><ShieldCheck className="size-4" />{busy ? "Verifying…" : "Verify"}</Button></form>}
      {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {verified && <>
        <form onSubmit={(event) => void approve(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="staff-creator-email">Player account recovery email</Label><Input id="staff-creator-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email verified on their player account" /></div>
          <div className="space-y-2"><Label htmlFor="staff-creator-username">OpenWorlds username</Label><Input id="staff-creator-username" required minLength={2} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Their game username" /></div>
          <div className="space-y-2"><Label htmlFor="staff-creator-display">Public creator name</Label><Input id="staff-creator-display" required minLength={2} maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Name displayed publicly" /></div>
          <div className="space-y-2"><Label htmlFor="staff-creator-platform">Social platform</Label><Input id="staff-creator-platform" required maxLength={40} value={socialPlatform} onChange={(event) => setSocialPlatform(event.target.value)} placeholder="YouTube, Twitch, TikTok…" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="staff-creator-social">Social profile link</Label><Input id="staff-creator-social" type="url" required maxLength={500} value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} placeholder="https://…" /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={saving}><BadgeCheck className="size-4" />{saving ? "Saving…" : "Verify creator and award badge"}</Button></div>
        </form>
        {actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}
        {actionMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{actionMessage}</p>}
        <div className="mt-5 space-y-2">
          <h4 className="text-sm font-semibold">Current verified creators</h4>
          {creators === undefined ? <p className="text-sm text-slate-500">Loading creator list…</p> : creators.length === 0 ? <p className="text-sm text-slate-500">No verified creators yet.</p> : creators.map((creator) => <article key={creator._id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3"><div><p className="flex items-center gap-2 text-sm font-medium">{creator.displayName} <BadgeCheck className="size-4 text-sky-600" /></p><p className="text-xs text-slate-600">@{creator.username} · {creator.socialPlatform || "Social profile"} · {creator.isLinked ? "Linked player account" : "Not linked to an account"}</p>{creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066cc] underline">Open social profile</a>}</div><Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void removeCreatorEntry(creator._id)}>Remove badge</Button></article>)}
        </div>
      </>}
    </section>
  );
}
