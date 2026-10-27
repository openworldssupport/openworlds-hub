import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowDownToLine, BadgeCheck, ImageUp, Megaphone, Search, ShieldCheck, Users } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { AccountSecuritySettings } from "@/pages/AccountSecurity";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const updatePublicProfile = useMutation(api.users.updatePublicProfile);
  const setProfileDiscoverability = useMutation(api.users.setProfileDiscoverability);
  const generatePlayerUploadUrl = useMutation(api.gameData.playerMediaUploadUrl);
  const finalizePlayerImage = useMutation(api.gameData.finalizePlayerImage);
  const publishWorld = useMutation(api.gameData.publishWorld);
  const myPublishedWorlds = useQuery(api.gameData.myPublishedWorlds, user?.role === "user" ? {} : "skip");
  const friendsData = useQuery(api.users.myFriends, user?.role === "user" ? {} : "skip");
  const respondFriendRequest = useMutation(api.users.respondToFriendRequest);
  const profilePrivacy = useQuery(api.users.currentProfilePrivacy, user?.role === "user" ? {} : "skip");
  const recoveryStatus = useQuery(
    api.playerRecovery.recoveryStatus,
    user?.role === "user" ? {} : "skip",
  );
  const requestRecoveryCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const verifyRecoveryCode = useMutation(api.playerRecovery.verifyRecoveryEmail);
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [worldTitle, setWorldTitle] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [worldImages, setWorldImages] = useState<Array<{ storageId: Id<"_storage">; url: string }>>([]);
  const [worldMessage, setWorldMessage] = useState("");
  const [worldBusy, setWorldBusy] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [changingRecoveryEmail, setChangingRecoveryEmail] = useState(false);

  useEffect(() => {
    if (!profilePrivacy) return;
    setDisplayName(profilePrivacy.displayName || user?.playerName || "");
    setAbout(profilePrivacy.about);
    setFriendsVisible(profilePrivacy.friendsVisible);
  }, [profilePrivacy?.displayName, profilePrivacy?.about, profilePrivacy?.friendsVisible, user?.playerName]);

  async function savePublicProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage("");
    try {
      await updatePublicProfile({ displayName, about, friendsVisible });
      setProfileMessage("Your public profile was saved.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save your public profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function uploadProfileImage(file?: File) {
    if (!file) return;
    setProfileBusy(true);
    setProfileMessage("");
    try {
      if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("Choose a JPG, PNG, WebP, or GIF image up to 5 MB.");
      const uploadUrl = await generatePlayerUploadUrl({});
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The image upload failed. Please try again.");
      const { storageId } = await response.json() as { storageId: Id<"_storage"> };
      await finalizePlayerImage({ storageId, kind: "profile" });
      setProfileMessage("Profile photo updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not upload your profile photo.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function uploadWorldImages(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (worldImages.length + selected.length > 5) {
      setWorldMessage("Choose up to 5 pictures for each world.");
      return;
    }
    setWorldBusy(true);
    setWorldMessage("");
    try {
      const uploaded: Array<{ storageId: Id<"_storage">; url: string }> = [];
      for (const file of selected) {
        if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("Choose JPG, PNG, WebP, or GIF images up to 5 MB each.");
        const uploadUrl = await generatePlayerUploadUrl({});
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error("A world image upload failed.");
        const { storageId } = await response.json() as { storageId: Id<"_storage"> };
        const asset = await finalizePlayerImage({ storageId, kind: "world" });
        if (!asset.url) throw new Error("Could not confirm the uploaded image.");
        uploaded.push({ storageId, url: asset.url });
      }
      setWorldImages((current) => [...current, ...uploaded]);
      setWorldMessage(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} ready to publish.`);
    } catch (error) {
      setWorldMessage(error instanceof Error ? error.message : "Could not upload world images.");
    } finally {
      setWorldBusy(false);
    }
  }

  async function publishPlayerWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorldBusy(true);
    setWorldMessage("");
    try {
      await publishWorld({ title: worldTitle, description: worldDescription, imageStorageIds: worldImages.map((image) => image.storageId) });
      setWorldTitle("");
      setWorldDescription("");
      setWorldImages([]);
      setWorldMessage("Your world is now published in discovery.");
    } catch (error) {
      setWorldMessage(error instanceof Error ? error.message : "Could not publish your world.");
    } finally {
      setWorldBusy(false);
    }
  }

  async function sendRecoveryCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryBusy(true);
    setRecoveryMessage("");
    try {
      await requestRecoveryCode({ email: recoveryEmail });
      setRecoveryMessage("Code sent. Check your inbox and verify this email to enable password resets.");
    } catch (error) {
      setRecoveryMessage(error instanceof Error ? error.message : "Could not send a verification code.");
    } finally {
      setRecoveryBusy(false);
    }
  }

  async function verifyRecoveryEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryBusy(true);
    setRecoveryMessage("");
    try {
      const result = await verifyRecoveryCode({ code: recoveryCode });
      if (!result.ok) throw new Error(result.message);
      setRecoveryCode("");
      setRecoveryEmail("");
      setChangingRecoveryEmail(false);
      setRecoveryMessage("Recovery email verified.");
    } catch (error) {
      setRecoveryMessage(error instanceof Error ? error.message : "Could not verify the recovery email.");
    } finally {
      setRecoveryBusy(false);
    }
  }

  if (!user || user.role !== "user") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteNav />
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-3xl font-semibold">Player account required</h1>
          <p className="mt-3 text-slate-600">
            {user
              ? "You’re signed in with a different account. Sign in with a player account or create one to open the player hub."
              : "Sign in to a player account or create one to open the player hub."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline"><Link to="/player-login">Player log in</Link></Button>
            <Button asChild><Link to="/player-signup">Create player account</Link></Button>
          </div>
        </section>
      </main>
    );
  }

  const recoveryEmailIsVerified = Boolean(recoveryStatus?.isVerified);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />

      {!recoveryEmailIsVerified ? (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">One more step</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Verify your recovery email</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">You need to verify a recovery email before accessing your player profile and saved game data. Your account has been created and is safe; verification unlocks the player hub.</p>
            <form onSubmit={sendRecoveryCode} className="mt-6 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="required-recovery-email">Recovery email</Label><Input id="required-recovery-email" type="email" autoComplete="email" required maxLength={254} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder={recoveryStatus?.pendingEmail ?? "you@example.com"} /></div>
              <Button type="submit" disabled={recoveryBusy || !recoveryEmail.trim()}>{recoveryBusy ? "Sending…" : recoveryStatus?.pendingEmail ? "Resend verification code" : "Send verification code"}</Button>
            </form>
            {recoveryStatus?.pendingEmail && (
              <form onSubmit={verifyRecoveryEmail} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-full max-w-xs space-y-2"><Label htmlFor="required-recovery-code">Email verification code</Label><Input id="required-recovery-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" /></div>
                <Button type="submit" disabled={recoveryBusy || recoveryCode.length !== 6}>{recoveryBusy ? "Verifying…" : "Verify email"}</Button>
              </form>
            )}
            {recoveryMessage && <p role="status" className="mt-4 text-sm text-slate-700">{recoveryMessage}</p>}
            <Button type="button" variant="ghost" className="mt-4" onClick={() => void signOut()}>Sign out</Button>
          </section>
        </div>
      ) : (
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7651c9]"><Megaphone className="size-4" /> Player account</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Manage your public profile, friends, and worlds. Signed in as @{user.playerUsername ?? "player"}.</p>
        </motion.div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="flex items-center gap-2 font-semibold tracking-tight">Player profile{user.isOfficialCreator && <span title="Verified Official Content Creator" className="inline-flex items-center text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>}</h2><p className="mt-1 text-sm text-slate-500">Update the name shown on your player account.</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
            </div>
            <div className="mt-6">
              <form onSubmit={savePublicProfile} className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  {profilePrivacy?.profileImage ? <img src={profilePrivacy.profileImage} alt="Your profile" className="size-16 border border-slate-200 object-cover" /> : <span className="flex size-16 items-center justify-center border border-slate-200 bg-slate-50 text-slate-400"><Users className="size-7" /></span>}
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><ImageUp className="size-4" /> Upload profile picture<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={profileBusy} onChange={(event) => { void uploadProfileImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
                  <span className="text-xs text-slate-500">JPG, PNG, WebP or GIF · max 5 MB</span>
                </div>                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="player-username">Username</Label><Input id="player-username" value={user.playerUsername ? `@${user.playerUsername}` : "Username unavailable"} readOnly className="bg-slate-50" /></div>
                  <div className="space-y-2"><Label htmlFor="player-display-name">Display name</Label><Input id="player-display-name" minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={user.playerName} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="player-about">About me</Label><textarea id="player-about" maxLength={500} rows={4} value={about} onChange={(event) => setAbout(event.target.value)} placeholder="A little about you and what you like to build…" className="w-full resize-y border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#176b45]" /><p className="text-right text-xs text-slate-500">{about.length}/500</p></div>
                <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={friendsVisible} onChange={(event) => setFriendsVisible(event.target.checked)} className="mt-1 accent-[#176b45]" /><span>Show my friends list on my public profile. Friend requests and messages stay private to the people involved.</span></label>
                <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={profileBusy || !displayName.trim()}>{profileBusy ? "Saving…" : "Save public profile"}</Button>{profileMessage && <p role="status" className="text-sm text-slate-600">{profileMessage}</p>}</div>
              </form>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div><p className="flex items-center gap-2 text-sm font-medium text-slate-800"><Search className="size-4 text-[#0066cc]" /> Profile discovery</p><p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">{profilePrivacy?.discoverable ? "Your profile appears in player searches and can receive friend requests." : "Your profile is hidden from searches and friend requests."}</p></div>
                <Button type="button" size="sm" variant="outline" disabled={profilePrivacy === undefined} onClick={() => { void setProfileDiscoverability({ discoverable: !profilePrivacy?.discoverable }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not update profile visibility.")); }}>{profilePrivacy?.discoverable ? "Hide my profile" : "Make discoverable"}</Button>
              </div>
              {friendsData && <section className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Friend requests</h3>{friendsData.requests.length ? <ul className="mt-2 space-y-2">{friendsData.requests.map((request) => <li key={request.requestId} className="flex items-center justify-between gap-2 border border-slate-200 p-3 text-sm"><span>@{request.username}</span><span className="flex gap-2"><Button size="sm" onClick={() => { void respondFriendRequest({ requestId: request.requestId, accept: true }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not accept friend request.")); }}>Accept</Button><Button size="sm" variant="outline" onClick={() => { void respondFriendRequest({ requestId: request.requestId, accept: false }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not decline friend request.")); }}>Decline</Button></span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No new requests.</p>}</div><div><h3 className="text-sm font-semibold">Your friends ({friendsData.friends.length})</h3>{friendsData.friends.length ? <ul className="mt-2 space-y-2">{friendsData.friends.map((friend) => <li key={friend.username} className="flex items-center gap-2 border border-slate-200 p-2 text-sm">{friend.image ? <img src={friend.image} alt="" className="size-8 object-cover" /> : <span className="size-8 bg-slate-100" />}<span>@{friend.username}</span><Button asChild size="sm" variant="outline" className="ml-auto"><Link to={`/players/${encodeURIComponent(friend.username)}`}>Message</Link></Button></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Your accepted friends will appear here.</p>}</div></section>}
            </div>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <AccountSecuritySettings />
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-semibold tracking-tight">Account recovery</h2>
            <p className="mt-1 text-sm text-slate-500">A verified recovery email is required to use your player account and reset your password.</p>
            {!changingRecoveryEmail && recoveryStatus?.isVerified ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-emerald-700">Recovery email verified: {recoveryStatus.recoveryEmail}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => { setChangingRecoveryEmail(true); setRecoveryMessage(""); }}>Change email</Button>
              </div>
            ) : (
              <form onSubmit={sendRecoveryCode} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="account-recovery-email">Recovery email</Label><Input id="account-recovery-email" type="email" autoComplete="email" required maxLength={254} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder={recoveryStatus?.pendingEmail ?? "you@example.com"} /></div>
                <Button type="submit" variant="outline" disabled={recoveryBusy || !recoveryEmail.trim()}>{recoveryBusy ? "Sending…" : recoveryStatus?.pendingEmail ? "Resend verification code" : "Send verification code"}</Button>
                {changingRecoveryEmail && <Button type="button" variant="ghost" onClick={() => { setChangingRecoveryEmail(false); setRecoveryEmail(""); setRecoveryCode(""); setRecoveryMessage(""); }}>Cancel</Button>}
              </form>
            )}
            {recoveryStatus?.pendingEmail && (
              <form onSubmit={verifyRecoveryEmail} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-full max-w-xs space-y-2"><Label htmlFor="account-recovery-code">Email code</Label><Input id="account-recovery-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" /></div>
                <Button type="submit" disabled={recoveryBusy || recoveryCode.length !== 6}>{recoveryBusy ? "Verifying…" : "Verify email"}</Button>
              </form>
            )}
            {recoveryMessage && <p role="status" className="mt-3 text-sm text-slate-600">{recoveryMessage}</p>}
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-semibold tracking-tight">Publish a world</h2>
            <p className="mt-1 text-sm text-slate-500">Share a real world listing in public discovery with a description and up to five pictures.</p>
            <form onSubmit={publishPlayerWorld} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="world-title">World name</Label><Input id="world-title" minLength={2} maxLength={60} value={worldTitle} onChange={(event) => setWorldTitle(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="world-description">Description</Label><textarea id="world-description" maxLength={1000} rows={3} value={worldDescription} onChange={(event) => setWorldDescription(event.target.value)} className="w-full resize-y border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="world-pictures">World pictures (up to 5)</Label><Input id="world-pictures" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={worldBusy || worldImages.length >= 5} onChange={(event) => { void uploadWorldImages(event.target.files); event.currentTarget.value = ""; }} />{worldImages.length > 0 && <div className="flex flex-wrap gap-2">{worldImages.map((image) => <img key={image.storageId} src={image.url} alt="World preview" className="size-20 border border-slate-200 object-cover" />)}</div>}</div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" disabled={worldBusy || worldTitle.trim().length < 2}>{worldBusy ? "Working…" : "Publish world"}</Button>{worldMessage && <p role="status" className="text-sm text-slate-600">{worldMessage}</p>}</div>
            </form>
            {myPublishedWorlds?.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{myPublishedWorlds.map((world) => <li key={world.id} className="flex gap-3 border border-slate-200 p-3 text-sm">{world.image && <img src={world.image} alt="" className="size-14 object-cover" />}<div><Link to={`/worlds/${world.id}`} className="font-medium text-[#176b45] hover:underline">{world.title}</Link><p className="mt-1 line-clamp-2 text-slate-500">{world.description}</p></div></li>)}</ul> : null}
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-[#7651c9]"><ArrowDownToLine className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Downloads</h2><p className="text-xs text-slate-400">Official builds only</p></div>
            </div>
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-6 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">Windows launcher available</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Download the official OpenWorlds Launcher from the Downloads page.</p>
              <Button asChild className="mt-4">
                <Link to="/downloads"><ArrowDownToLine className="size-4" /> Windows download</Link>
              </Button>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> The release does not list Windows system requirements yet.</div>
          </motion.section>
        </div>
      </div>
      )}
    </main>
  );
}

