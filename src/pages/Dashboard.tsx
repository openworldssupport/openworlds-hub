import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowDownToLine, Megaphone, ShieldCheck } from "lucide-react";
import { AccountSecuritySettings } from "@/pages/AccountSecurity";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const updateProfile = useMutation(api.gameData.updateProfile);
  const recoveryStatus = useQuery(
    api.playerRecovery.recoveryStatus,
    user?.role === "user" ? {} : "skip",
  );
  const requestRecoveryCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const verifyRecoveryCode = useMutation(api.playerRecovery.verifyRecoveryEmail);
  const [displayName, setDisplayName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [changingRecoveryEmail, setChangingRecoveryEmail] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function savePlayerName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage("");
    try {
      await updateProfile({ displayName });
      setDisplayName("");
      setSaveMessage("Player name updated.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not update player name.");
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7651c9]"><Megaphone className="size-4" /> Player account</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Your player profile is private to your account. Signed in as {user.playerName}.</p>
        </motion.div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="font-semibold tracking-tight">Player profile</h2><p className="mt-1 text-sm text-slate-500">Update the name shown on your player account.</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
            </div>
            <div className="mt-6">
              <form onSubmit={savePlayerName} className="space-y-3">
                <Label htmlFor="player-display-name">Player name</Label>
                <div className="flex gap-2"><Input id="player-display-name" minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={user.playerName} /><Button type="submit" variant="outline" disabled={!displayName.trim()}>Update</Button></div>
              </form>
              {saveMessage ? <p role="status" className="mt-2 text-sm text-slate-600">{saveMessage}</p> : null}
            </div>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <AccountSecuritySettings />
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-semibold tracking-tight">Account recovery</h2>
            <p className="mt-1 text-sm text-slate-500">A verified recovery email lets you reset your password. It’s optional.</p>
            {recoveryStatus?.isVerified && !changingRecoveryEmail ? (
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
            {recoveryStatus?.pendingEmail && recoveryStatus.pendingEmail !== recoveryStatus.recoveryEmail && (
              <form onSubmit={verifyRecoveryEmail} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-full max-w-xs space-y-2"><Label htmlFor="account-recovery-code">Email code</Label><Input id="account-recovery-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" /></div>
                <Button type="submit" disabled={recoveryBusy || recoveryCode.length !== 6}>{recoveryBusy ? "Verifying…" : "Verify email"}</Button>
              </form>
            )}
            {recoveryMessage && <p role="status" className="mt-3 text-sm text-slate-600">{recoveryMessage}</p>}
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
    </main>
  );
}

