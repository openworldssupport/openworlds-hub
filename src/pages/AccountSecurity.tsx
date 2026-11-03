import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DeviceSessionsSettings } from "@/components/DeviceSessionsSettings";

export function AccountSecuritySettings() {
  const { user } = useAuth();
  const playerProfile = useQuery(api.gameData.myGameData, user?.role === "user" ? {} : "skip");
  const staffProfile = useQuery(api.staff.me, user && user.role !== "user" ? {} : "skip");
  const accountSecurity = useQuery(api.accountSecurity.status);
  const updatePlayerProfile = useMutation(api.gameData.updateProfile);
  const updateStaffProfile = useMutation(api.accountSecurity.updateProfile);
  const beginSetup = useMutation(api.accountSecurity.beginSetup);
  const recoveryStatus = useQuery(api.playerRecovery.recoveryStatus, user && user.role !== "user" ? {} : "skip");
  const requestRecoveryCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const verifyRecoveryCode = useMutation(api.playerRecovery.verifyRecoveryEmail);
  const confirmSetup = useMutation(api.accountSecurity.confirmSetup);
  const disable = useMutation(api.accountSecurity.disable);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [changingRecovery, setChangingRecovery] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (user?.role === "user") await updatePlayerProfile({ displayName: name });
      else await updateStaffProfile({ name });
      setName(""); setMessage("Your account name has been updated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update your account."); }
    finally { setBusy(false); }
  }

  async function startSetup() {
    setBusy(true); setError(""); setMessage("");
    try { setSetup(await beginSetup({})); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not start setup."); }
    finally { setBusy(false); }
  }

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await confirmSetup({ code });
      setRecoveryCodes(result.recoveryCodes); setSetup(null); setCode("");
      setMessage("Two-step verification is on. Save the recovery codes below; they are shown only once.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify that authenticator code."); }
    finally { setBusy(false); }
  }

  async function sendRecoveryCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setRecoveryNote("");
    try {
      await requestRecoveryCode({ email: recoveryInput });
      setRecoveryNote("We emailed a 6-digit code to that address. Enter it below to activate the recovery email.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send the verification email."); }
    finally { setBusy(false); }
  }

  async function confirmRecoveryCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setRecoveryNote("");
    try {
      const result = await verifyRecoveryCode({ code: recoveryCodeInput });
      if (!result.ok) throw new Error(result.message);
      setRecoveryInput(""); setRecoveryCodeInput(""); setChangingRecovery(false);
      setRecoveryNote("Recovery email verified. It is now the address used for account recovery.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify that code."); }
    finally { setBusy(false); }
  }

  async function turnOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await disable({ code }); setCode(""); setMessage("Two-step verification is off."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not disable two-step verification."); }
    finally { setBusy(false); }
  }

  if (!user || accountSecurity === undefined) return null;
  const currentName = user.role === "user" ? playerProfile?.displayName : staffProfile?.nickname ?? staffProfile?.name;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-slate-500" /><h2 className="font-semibold">Account & security</h2></div>
      <form onSubmit={(event) => void saveProfile(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="account-display-name">{user.role === "user" ? "Player name" : "Display name"}</Label><Input id="account-display-name" required minLength={2} maxLength={user.role === "user" ? 32 : 40} value={name} onChange={(event) => setName(event.target.value)} placeholder={currentName ?? "Your name"} /></div>
        <Button type="submit" variant="outline" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save name"}</Button>
      </form>
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium">Two-step verification: {accountSecurity.enabled ? "On" : "Off"}</p>
        <p className="mt-1 text-xs text-slate-500">{user.role === "user" ? "Optional authenticator app codes add an extra sign-in check. Also required to sign out other devices." : "Needed to unlock staff tools: the admin console, creator approvals, announcements, moderation, and (for administrators) the website status switch. Also required to sign out other devices."}</p>
        {accountSecurity.enabled ? (
          <form onSubmit={(event) => void turnOff(event)} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-2"><Label htmlFor="disable-two-factor">Authenticator or recovery code</Label><Input id="disable-two-factor" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value)} /></div>
            <Button type="submit" variant="outline" disabled={busy}>{busy ? "Checking…" : "Turn off"}</Button>
          </form>
        ) : setup ? (
          <form onSubmit={(event) => void enable(event)} className="mt-4 space-y-3">
            <div className="rounded-md bg-slate-50 p-3 text-sm"><p>In your authenticator app, add an account and enter this setup key:</p><code className="mt-2 block break-all font-mono font-semibold">{setup.secret}</code><a href={setup.uri} className="mt-2 inline-block text-[#0066cc] underline">Open authenticator app</a></div>
            <div className="max-w-xs space-y-2"><Label htmlFor="enable-two-factor">6-digit app code</Label><Input id="enable-two-factor" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
            <div className="flex gap-2"><Button type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Enable two-step verification"}</Button><Button type="button" variant="outline" onClick={() => { setSetup(null); setCode(""); }}>Cancel</Button></div>
          </form>
        ) : <Button className="mt-3" variant="outline" disabled={busy} onClick={() => void startSetup()}>{busy ? "Starting…" : "Set up authenticator"}</Button>}
        {recoveryCodes.length > 0 && <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-semibold">Recovery codes — save them somewhere safe</p><ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">{recoveryCodes.map((item) => <li key={item}>{item}</li>)}</ul><Button className="mt-3" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(recoveryCodes.join("\n")); setMessage("Recovery codes copied."); }}>Copy codes</Button></div>}
      </div>
      {user.role !== "user" && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium">Recovery email: {recoveryStatus?.isVerified ? "verified" : "not set"}</p>
          <p className="mt-1 text-xs text-slate-500">Optional. A new recovery email is emailed a 6-digit code, and it only becomes active once you enter that code. It must differ from your company email.</p>
          {recoveryStatus?.isVerified && !changingRecovery ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm text-emerald-700">{recoveryStatus.recoveryEmail}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => { setChangingRecovery(true); setRecoveryNote(""); }}>Change email</Button>
            </div>
          ) : (
            <form onSubmit={(event) => void sendRecoveryCode(event)} className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-full max-w-xs space-y-2"><Label htmlFor="staff-recovery-email">Recovery email</Label><Input id="staff-recovery-email" type="email" autoComplete="email" required maxLength={254} value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} placeholder={recoveryStatus?.pendingEmail ?? "you@example.com"} /></div>
              <Button type="submit" variant="outline" disabled={busy || !recoveryInput.trim()}>{busy ? "Sending…" : recoveryStatus?.pendingEmail ? "Resend verification code" : "Send verification code"}</Button>
              {changingRecovery && <Button type="button" variant="ghost" onClick={() => { setChangingRecovery(false); setRecoveryInput(""); setRecoveryCodeInput(""); setRecoveryNote(""); }}>Cancel</Button>}
            </form>
          )}
          {recoveryStatus?.pendingEmail && (
            <form onSubmit={(event) => void confirmRecoveryCode(event)} className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-full max-w-xs space-y-2"><Label htmlFor="staff-recovery-code">Code sent to {recoveryStatus.pendingEmail}</Label><Input id="staff-recovery-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={recoveryCodeInput} onChange={(event) => setRecoveryCodeInput(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" /></div>
              <Button type="submit" disabled={busy || recoveryCodeInput.length !== 6}>{busy ? "Verifying…" : "Verify email"}</Button>
            </form>
          )}
          {recoveryNote && <p role="status" className="mt-3 text-sm text-slate-600">{recoveryNote}</p>}
        </div>
      )}
      <DeviceSessionsSettings />
      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
