import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, BadgeCheck, ImageUp, Megaphone, ShieldCheck, Users } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { AccountSecuritySettings } from "@/pages/AccountSecurity";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const updatePublicProfile = useMutation(api.users.updatePublicProfile);
  const claimPlayerUsername = useMutation(api.users.claimPlayerUsername);
  const setFriendRequestsEnabled = useMutation(api.users.setFriendRequestsEnabled);
  const generatePlayerUploadUrl = useMutation(api.gameData.playerMediaUploadUrl);
  const finalizeProfileImage = useAction(api.imageSafety.finalizeProfileImage);
  const myPublishedWorlds = useQuery(api.gameData.myPublishedWorlds, user ? {} : "skip");
  const friendsData = useQuery(api.users.myFriends, user ? {} : "skip");
  const respondFriendRequest = useMutation(api.users.respondToFriendRequest);
  const profilePrivacy = useQuery(api.users.currentProfilePrivacy, user ? {} : "skip");
  const moderationWarnings = useQuery(api.moderation.myWarnings, user ? {} : "skip");
  const recoveryStatus = useQuery(
    api.playerRecovery.recoveryStatus,
    user?.role === "user" ? {} : "skip",
  );
  const pendingStaffConversion = useQuery(
    api.admin.myPendingStaffConversion,
    user ? {} : "skip",
  );
  const confirmStaffConversion = useMutation(api.admin.confirmStaffConversion);
  const requestRecoveryCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const verifyRecoveryCode = useMutation(api.playerRecovery.verifyRecoveryEmail);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [changingRecoveryEmail, setChangingRecoveryEmail] = useState(false);
  const [staffConversionCode, setStaffConversionCode] = useState("");
  const [staffConversionMessage, setStaffConversionMessage] = useState("");
  const [staffConversionBusy, setStaffConversionBusy] = useState(false);
  const [staffConversionComplete, setStaffConversionComplete] = useState(false);

  useEffect(() => {
    if (!profilePrivacy) return;
    setDisplayName(profilePrivacy.displayName || user?.playerName || "");
    setAbout(profilePrivacy.about);
    setFriendsVisible(profilePrivacy.friendsVisible);
  }, [profilePrivacy?.displayName, profilePrivacy?.about, profilePrivacy?.friendsVisible, user?.playerName]);

  async function chooseUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameBusy(true);
    setUsernameMessage("");
    try {
      const result = await claimPlayerUsername({ username: usernameDraft });
      setUsernameMessage(`Your public username is @${result.username}.`);
      setUsernameDraft("");
    } catch (error) {
      setUsernameMessage(error instanceof Error ? error.message : "Could not save your username.");
    } finally {
      setUsernameBusy(false);
    }
  }

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
      const result = await finalizeProfileImage({ storageId });
      setProfileMessage(result.screened
        ? "Profile photo updated."
        : "Profile photo updated. Automatic image screening is not configured, so this photo was saved without it.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not upload your profile photo.");
    } finally {
      setProfileBusy(false);
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

  async function submitStaffConversion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = staffConversionCode.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (code.length !== 8) {
      setStaffConversionMessage("Enter the 8-character confirmation code from the administrator.");
      return;
    }
    setStaffConversionBusy(true);
    setStaffConversionMessage("");
    try {
      const result = await confirmStaffConversion({ code });
      setStaffConversionComplete(true);
      setStaffConversionCode("");
      setStaffConversionMessage(`Staff access confirmed for ${result.email}. Your account is unchanged except for the new staff role and assignment.`);
    } catch (error) {
      setStaffConversionMessage(error instanceof Error ? error.message : "Could not confirm the staff conversion.");
    } finally {
      setStaffConversionBusy(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteNav />
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-3xl font-semibold">Sign in to open your player hub</h1>
          <p className="mt-3 text-slate-600">
            Your OpenWorlds hub holds your public profile, worlds, friends, and messages. Staff and company accounts use the same hub — sign in with your usual account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline"><Link to="/player-login">Player log in</Link></Button>
            <Button asChild><Link to="/player-signup">Create player account</Link></Button>
          </div>
        </section>
      </main>
    );
  }

  const isPlayerAccount = user.role === "user";
  const recoveryEmailIsVerified = Boolean(recoveryStatus?.isVerified);
  // Recovery email is optional: only block the hub while a supplied email is unverified.
  const needsRecoveryVerification = !recoveryEmailIsVerified && Boolean(recoveryStatus?.recoveryEmail || recoveryStatus?.pendingEmail);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />

      {needsRecoveryVerification ? (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Verify your recovery email</h1>
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
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Manage your public profile, friends, and worlds. Signed in as {user.playerUsername ? `@${user.playerUsername}` : user.playerName}.</p>
        </motion.div>

        {staffConversionComplete ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight text-emerald-950"><ShieldCheck className="size-4 text-emerald-700" /> Staff access confirmed</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">{staffConversionMessage}</p>
            <Button asChild className="mt-4"><Link to="/staff">Open staff workspace</Link></Button>
          </motion.section>
        ) : pendingStaffConversion ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight text-amber-950"><ShieldCheck className="size-4 text-amber-700" /> Confirm your staff conversion</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950/80">
              An administrator requested staff access for this account: <strong>{pendingStaffConversion.department} / {pendingStaffConversion.position}</strong>, using <strong>{pendingStaffConversion.email}</strong>. Nothing changes until you enter the private confirmation code they give you.
            </p>
            {pendingStaffConversion.expired ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">This code expired. Ask the administrator to generate a new one.</p>
            ) : (
              <form onSubmit={submitStaffConversion} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-full max-w-xs space-y-2">
                  <Label htmlFor="staff-conversion-code">Confirmation code</Label>
                  <Input
                    id="staff-conversion-code"
                    autoComplete="off"
                    required
                    maxLength={9}
                    value={staffConversionCode}
                    onChange={(event) => {
                      const raw = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
                      setStaffConversionCode(raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw);
                    }}
                    placeholder="ABCD-EFGH"
                  />
                </div>
                <Button type="submit" disabled={staffConversionBusy || staffConversionCode.replace(/[^A-Z0-9]/g, "").length !== 8}>{staffConversionBusy ? "Confirming…" : "Confirm staff access"}</Button>
              </form>
            )}
            {staffConversionMessage && <p role="status" className="mt-3 text-sm text-amber-950">{staffConversionMessage}</p>}
            <p className="mt-3 text-xs leading-5 text-amber-900/80">Only enter a code you received directly from an OpenWorlds administrator. The code expires {new Date(pendingStaffConversion.expiresAt).toLocaleString()} and only works for your account.</p>
          </motion.section>
        ) : null}

        {moderationWarnings?.warnings.length ? (
          <motion.section id="account-warnings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6 scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight text-amber-950"><AlertTriangle className="size-4 text-amber-700" /> Account warnings</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">Our moderation system records warnings when reports and evidence meet the review threshold. Repeated or severe rule breaking can lead to a temporary or permanent restriction.</p>
            <ul className="mt-4 divide-y divide-amber-200/70 border-y border-amber-200/70">
              {moderationWarnings.warnings.map((warning) => (
                <li key={warning._id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium capitalize text-amber-950">{warning.severity} warning</span>
                    <span className="text-xs text-amber-800">{new Date(warning.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">{warning.reason}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-amber-800">If you believe a warning is wrong, contact the team through <Link to="/support" className="underline">Support</Link> and include your username.</p>
          </motion.section>
        ) : null}

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="flex items-center gap-2 font-semibold tracking-tight">Player profile{user.isOfficialCreator && <span title="Verified Official Content Creator" className="inline-flex items-center text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>}</h2><p className="mt-1 text-sm text-slate-500">Update the name and details shown on your public profile.</p></div>
              <div className="flex flex-wrap gap-2">{user.playerUsername && <Button asChild variant="outline" size="sm"><Link to={`/players/${encodeURIComponent(user.playerUsername)}`}>View public profile</Link></Button>}<Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
            </div>
            <div className="mt-6">
              {!user.playerUsername && (
                <form onSubmit={chooseUsername} className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">Choose your public username</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Your username is how other players find and mention you. It is shared with your staff profile and cannot be changed later.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">@</span>
                    <Input value={usernameDraft} onChange={(event) => setUsernameDraft(event.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase().slice(0, 24))} minLength={3} maxLength={24} placeholder="yourname" aria-label="Public username" className="max-w-56 bg-white" required />
                    <Button type="submit" disabled={usernameBusy || usernameDraft.length < 3}>{usernameBusy ? "Saving…" : "Save username"}</Button>
                  </div>
                  {usernameMessage && <p role="status" className="mt-2 text-sm text-slate-700">{usernameMessage}</p>}
                </form>
              )}
              <form onSubmit={savePublicProfile} className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  {profilePrivacy?.profileImage ? <img src={profilePrivacy.profileImage} alt="Your profile" className="size-16 border border-slate-200 object-cover" /> : <span className="flex size-16 items-center justify-center border border-slate-200 bg-slate-50 text-slate-400"><Users className="size-7" /></span>}
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><ImageUp className="size-4" /> Upload profile picture<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={profileBusy} onChange={(event) => { void uploadProfileImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
                  <span className="text-xs text-slate-500">JPG, PNG, WebP or GIF · max 5 MB</span>
                </div>                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="player-username">Username</Label><Input id="player-username" value={user.playerUsername ? `@${user.playerUsername}` : "Username unavailable"} readOnly className="bg-slate-50" /></div>
                  <div className="space-y-2"><Label htmlFor="player-display-name">Display name</Label><Input id="player-display-name" minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={user.playerName} required /><p className="text-xs text-slate-500">Public. Profanity, slurs, and hate terms are not allowed.</p></div>
                </div>
                <div className="space-y-2"><Label htmlFor="player-about">About me</Label><textarea id="player-about" maxLength={500} rows={4} value={about} onChange={(event) => setAbout(event.target.value)} placeholder="A little about you and what you like to build…" className="w-full resize-y border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#176b45]" /><p className="text-right text-xs text-slate-500">{about.length}/500 · public, no profanity or slurs</p></div>
                <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={friendsVisible} onChange={(event) => setFriendsVisible(event.target.checked)} className="mt-1 accent-[#176b45]" /><span>Show my friends list on my public profile. Friend requests and messages stay private to the people involved.</span></label>
                <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={profileBusy || !displayName.trim()}>{profileBusy ? "Saving…" : "Save public profile"}</Button>{profileMessage && <p role="status" className="text-sm text-slate-600">{profileMessage}</p>}</div>
              </form>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div><p className="flex items-center gap-2 text-sm font-medium text-slate-800"><Users className="size-4 text-[#176b45]" /> Friend requests</p><p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">{profilePrivacy?.allowFriendRequests ? "Anyone who finds your profile can send a friend request. Accept or decline requests in your inbox." : "New friend requests are paused. Your profile stays visible and existing friends are unaffected."}</p></div>
                <Button type="button" size="sm" variant="outline" disabled={profilePrivacy === undefined} onClick={() => { void setFriendRequestsEnabled({ enabled: !profilePrivacy?.allowFriendRequests }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not update friend request settings.")); }}>{profilePrivacy?.allowFriendRequests ? "Pause friend requests" : "Allow friend requests"}</Button>
              </div>
              {friendsData && <section className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Friend requests</h3><Link to="/inbox" className="text-xs font-medium text-[#176b45] hover:underline">Open inbox</Link></div>{friendsData.requests.length ? <ul className="mt-2 space-y-2">{friendsData.requests.map((request) => <li key={request.requestId} className="flex items-center justify-between gap-2 border border-slate-200 p-3 text-sm"><span>@{request.username}</span><span className="flex gap-2"><Button size="sm" onClick={() => { void respondFriendRequest({ requestId: request.requestId, accept: true }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not accept friend request.")); }}>Accept</Button><Button size="sm" variant="outline" onClick={() => { void respondFriendRequest({ requestId: request.requestId, accept: false }).catch((error) => setProfileMessage(error instanceof Error ? error.message : "Could not decline friend request.")); }}>Decline</Button></span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No new requests.</p>}</div><div><h3 className="text-sm font-semibold">Your friends ({friendsData.friends.length})</h3>{friendsData.friends.length ? <ul className="mt-2 space-y-2">{friendsData.friends.map((friend) => <li key={friend.username} className="flex items-center gap-2 border border-slate-200 p-2 text-sm">{friend.image ? <img src={friend.image} alt="" className="size-8 object-cover" /> : <span className="size-8 bg-slate-100" />}<span className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${friend.presence === "in-game" ? "bg-sky-500" : friend.presence === "online" ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" title={friend.presence === "in-game" ? "In game" : friend.presence === "online" ? "Online on the website" : "Offline"} />@{friend.username}</span><span className="text-xs text-slate-500">{friend.presence === "in-game" ? "In game" : friend.presence === "online" ? "Online" : "Offline"}</span><Button asChild size="sm" variant="outline" className="ml-auto"><Link to={`/players/${encodeURIComponent(friend.username)}`}>Message</Link></Button></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Your accepted friends will appear here.</p>}</div></section>}
            </div>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <AccountSecuritySettings />
          </motion.section>
          {isPlayerAccount && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-semibold tracking-tight">Account recovery</h2>
            <p className="mt-1 text-sm text-slate-500">Optional. Adding one lets you reset your password if you forget it.</p>
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
          </motion.section>}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-semibold tracking-tight">Your worlds</h2>
            <p className="mt-1 text-sm text-slate-500">Worlds are created and published from inside OpenWorlds. The website only lists them, so there is nothing to publish here.</p>
            {myPublishedWorlds?.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{myPublishedWorlds.map((world) => <li key={world.id} className="flex gap-3 border border-slate-200 p-3 text-sm">{world.image && <img src={world.image} alt="" className="size-14 object-cover" />}<div><Link to={`/worlds/${world.id}`} className="font-medium text-[#176b45] hover:underline">{world.title}</Link><p className="mt-1 line-clamp-2 text-slate-500">{world.description}</p></div></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No worlds yet. Publish one in the game and it will appear here and in discovery.</p>}
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8">
            <div><h2 className="font-semibold tracking-tight">Downloads</h2><p className="text-xs text-slate-500">Official builds only</p></div>
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

