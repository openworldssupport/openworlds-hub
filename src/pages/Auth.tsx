import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, useLocation, useNavigate } from "react-router";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { containsBlockedLanguage } from "@/lib/contentFilter";

type AuthMode = "login" | "signup" | "create" | "player-login" | "player-signup";

interface AuthProps {
  mode?: AuthMode;
}

/**
 * One sign-in page for everyone. Player and staff accounts use the same form;
 * staff accounts can request a one-time email code instead of a password, and
 * are recognised after sign-in so extra protections can be applied.
 */
export default function AuthPage({ mode = "login" }: AuthProps) {
  const isSignup = mode === "signup" || mode === "create" || mode === "player-signup";
  return <UnifiedAuthPage isSignup={isSignup} />;
}

function OpenWorldsLogo() {
  return (
    <svg
      role="img"
      aria-label="OpenWorlds logo"
      viewBox="0 0 512 512"
      fill="none"
      className="size-12 text-[#0066cc]"
    >
      <circle cx="256" cy="256" r="154" stroke="currentColor" strokeWidth="24" />
      <path
        d="M102 256h308M256 102c43 42 65 94 65 154s-22 112-65 154m0-308c-43 42-65 94-65 154s22 112 65 154"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UnifiedAuthPage({ isSignup }: { isSignup: boolean }) {
  const { signIn } = useAuthActions();
  const passwordSignIn = useAction(api.accountSecurity.passwordSignIn);
  const completePasswordSignIn = useAction(api.accountSecurity.completePasswordSignIn);
  const prepareStaffSignIn = useAction(api.accountSecurity.prepareStaffSignIn);
  const requestStaffRecoveryDelivery = useMutation(api.accountSecurity.requestStaffRecoveryDelivery);
  const requestRecoveryEmailCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const sendPhoneSignInCode = useAction(api.phoneVerification.sendPhoneSignInCode);
  const completePhoneSignIn = useAction(api.phoneVerification.completePhoneSignIn);
  const sendStaffPhoneSignInCode = useAction(api.phoneVerification.sendStaffPhoneSignInCode);
  const completeStaffPhoneSignIn = useAction(api.phoneVerification.completeStaffPhoneSignIn);
  const beginPasswordReset = useAction(api.playerRecovery.beginPasswordReset);
  const resetPassword = useAction(api.playerRecovery.resetPassword);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const [method, setMethod] = useState<"password" | "email-code">("password");
  const [emailStep, setEmailStep] = useState<"email" | "code" | "two-factor">("email");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneNote, setPhoneNote] = useState("");
  const [resetStep, setResetStep] = useState<"closed" | "request" | "verify">("closed");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetMessages() {
    setError("");
    setNotice("");
    setDeliveryNote("");
    setPhoneNote("");
  }

  async function finishSignIn() {
    navigate(destination, { replace: true });
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (isSignup) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,23}$/.test(login.trim())) {
        setError("Choose a username with 3–24 letters, numbers, dots, hyphens, or underscores. Do not enter an email address here.");
        return;
      }
      if (containsBlockedLanguage(login)) {
        setError("That username contains language that is not allowed in public OpenWorlds spaces.");
        return;
      }
      if (name.trim().length < 2 || name.trim().length > 32) {
        setError("Display name must be 2–32 characters.");
        return;
      }
      if (containsBlockedLanguage(name)) {
        setError("That display name contains language that is not allowed in public OpenWorlds spaces.");
        return;
      }
      if (recoveryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) {
        setError("Enter a valid email address, or leave the email field blank.");
        return;
      }
      if (password.length < 12) {
        setError("Use a password with at least 12 characters.");
        return;
      }
    }
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const result = await signIn("player-password", {
          flow: "signUp",
          email: login.trim().toLowerCase(),
          name: name.trim(),
          recoveryEmail: recoveryEmail.trim(),
          password,
        });
        if (!result.signingIn) throw new Error("Account creation did not complete.");
        if (recoveryEmail.trim()) {
          try {
            await requestRecoveryEmailCode({ email: recoveryEmail.trim() });
            setNotice("Your account is saved. We sent a verification code to your recovery email. Verify it to continue.");
          } catch {
            setNotice("Your account is saved, but we could not send the verification code. You can add or correct the email on your dashboard.");
          }
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      const result = await passwordSignIn({ login: login.trim().toLowerCase(), password });
      if (result.required) {
        setTwoFactorToken(result.token ?? "");
        setPhoneVerified(Boolean(result.phoneVerified));
        setPhoneSent(false);
        if (!result.recoveryEmailVerified) {
          await signIn("player-password", {
            flow: "twoFactorSignIn",
            email: login.trim().toLowerCase(),
            password,
            twoFactorToken: result.token ?? "",
          });
          await finishSignIn();
          return;
        }
        setTwoFactorStep(true);
        return;
      }
      const signInResult = await signIn("player-password", {
        flow: "signIn",
        email: login.trim().toLowerCase(),
        password,
      });
      if (!signInResult.signingIn) throw new Error("Sign in did not complete.");
      await finishSignIn();
    } catch (signInError) {
      setError(signInError instanceof Error
        ? signInError.message
        : isSignup
          ? "Could not create your account."
          : "Username or password is incorrect.");
    } finally {
      setBusy(false);
    }
  }

  async function finishTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      if (phoneSent) {
        await completePhoneSignIn({ token: twoFactorToken, code: resetCode.trim() });
        await completePasswordSignIn({ login: login.trim().toLowerCase(), token: twoFactorToken, code: "", method: "phone" });
      } else {
        await completePasswordSignIn({ login: login.trim().toLowerCase(), token: twoFactorToken, code: resetCode.trim().toUpperCase() });
      }
      const signInResult = await signIn("player-password", {
        flow: "twoFactorSignIn",
        email: login.trim().toLowerCase(),
        password,
        twoFactorToken,
      });
      if (!signInResult.signingIn) throw new Error("Two-step sign-in did not complete.");
      await finishSignIn();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not verify that code.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPlayerPhoneCode() {
    setBusy(true);
    resetMessages();
    try {
      const result = await sendPhoneSignInCode({ token: twoFactorToken });
      setPhoneSent(true);
      setResetCode("");
      setPhoneNote(`We texted a six-digit code to ${result.phoneNumber ?? "your verified phone"}. Enter it below instead of an authenticator code.`);
    } catch (phoneError) {
      setError(phoneError instanceof Error ? phoneError.message : "Could not send a text-message code.");
    } finally {
      setBusy(false);
    }
  }

  async function requestStaffPhoneCode() {
    setBusy(true);
    resetMessages();
    try {
      const result = await sendStaffPhoneSignInCode({ email: login.trim().toLowerCase(), emailCode: emailCode.trim() });
      setTwoFactorToken(result.token);
      setPhoneSent(true);
      setAuthenticatorCode("");
      setPhoneNote(`We texted a six-digit code to ${result.phoneNumber ?? "your verified phone"}. Enter it below instead of an authenticator code.`);
    } catch (phoneError) {
      setError(phoneError instanceof Error ? phoneError.message : "Could not send a text-message code.");
    } finally {
      setBusy(false);
    }
  }

  async function requestEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      await signIn("email-otp", { email: login.trim().toLowerCase() });
      setEmailStep("code");
    } catch {
      setError("Could not send a sign-in code. If this account is eligible, try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  async function requestRecoveryEmailDelivery() {
    setBusy(true);
    resetMessages();
    try {
      await requestStaffRecoveryDelivery({ email: login.trim().toLowerCase() });
      await signIn("email-otp", { email: login.trim().toLowerCase() });
      setDeliveryNote("Your sign-in code was sent to the verified recovery email on this account.");
      setEmailStep("code");
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : "Could not send a code to the recovery email.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      const result = await prepareStaffSignIn({ email: login.trim().toLowerCase(), emailCode: emailCode.trim() });
      if (result.needsTwoFactor) {
        setPhoneVerified(Boolean(result.phoneVerified));
        setPhoneSent(false);
        setPhoneNote("");
        setEmailStep("two-factor");
        return;
      }
      const signInResult = await signIn("email-otp", { email: login.trim().toLowerCase(), code: emailCode.trim() });
      if (!signInResult.signingIn) throw new Error("Sign in did not complete.");
      await finishSignIn();
    } catch (codeError) {
      setError(codeError instanceof Error ? codeError.message : "That code could not be verified. Check it and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function finishEmailTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      if (phoneSent) {
        await completeStaffPhoneSignIn({
          email: login.trim().toLowerCase(),
          emailCode: emailCode.trim(),
          token: twoFactorToken,
          code: authenticatorCode.trim(),
        });
      } else {
        const result = await prepareStaffSignIn({
          email: login.trim().toLowerCase(),
          emailCode: emailCode.trim(),
          authenticatorCode: authenticatorCode.trim(),
        });
        if (result.needsTwoFactor) throw new Error("Enter a valid authenticator or recovery code.");
      }
      const signInResult = await signIn("email-otp", { email: login.trim().toLowerCase(), code: emailCode.trim() });
      if (!signInResult.signingIn) throw new Error("Sign in did not complete.");
      await finishSignIn();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Two-step verification failed. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    resetMessages();
    try {
      await beginPasswordReset({ login: login.trim().toLowerCase() });
      setResetStep("verify");
      setNotice("If that account has a verified recovery email, a 6-digit reset code is on its way to it.");
    } catch {
      setError("Could not request a reset code. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  async function finishReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    resetMessages();
    try {
      await resetPassword({ login: login.trim().toLowerCase(), code: resetCode.trim(), newPassword: password });
      setResetStep("closed");
      setPassword("");
      setConfirmPassword("");
      setResetCode("");
      setNotice("Password changed. Sign in with your new password.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not reset password. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  const heading = resetStep !== "closed"
    ? "Reset your password"
    : isSignup
      ? "Create your OpenWorlds account"
      : method === "email-code"
        ? emailStep === "email" ? "Sign in with an email code" : "Check your email"
        : "OpenWorlds sign in";

  const intro = resetStep !== "closed"
    ? "Enter the username or email on your account. We send the reset code to its verified recovery email."
    : isSignup
      ? "Choose a username, display name, and password. Email is optional and is only used to recover your account."
      : method === "email-code"
        ? emailStep === "email"
          ? "For staff accounts and accounts without a password. We send a one-time code to the company email an administrator added."
          : deliveryNote || "A one-time code was sent to the email address you entered. The code expires after 15 minutes."
        : "One sign-in for players and OpenWorlds staff. Staff accounts are recognised automatically and get extra security.";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <OpenWorldsLogo />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{intro}</p>

          {resetStep === "request" ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="reset-login">Username or email</Label><Input id="reset-login" autoComplete="username" required value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Your username or account email" /><p className="text-xs text-slate-500">The code goes to the verified recovery email, not to this address. No recovery email yet? Sign in and add one under Account recovery.</p></div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Requesting…" : "Send recovery code"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("closed"); resetMessages(); }}>Back to sign in</button>
            </form>
          ) : resetStep === "verify" ? (
            <form onSubmit={finishReset} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="reset-code">6-digit recovery code</Label><Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
              <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
              {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || resetCode.length !== 6}>{busy ? "Updating…" : "Set new password"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("request"); resetMessages(); }}>Request another code</button>
            </form>
          ) : isSignup ? (
            <form onSubmit={submitPassword} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="player-login">Username</Label><Input id="player-login" autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,23}" title="3–24 letters, numbers, dots, hyphens, or underscores. Do not use an email address." value={login} onChange={(event) => setLogin(event.target.value)} placeholder="yourname" /><p className="text-xs text-slate-500">Required. 3–24 letters, numbers, dots, hyphens or underscores. Profanity and slurs are not allowed.</p></div>
              <div className="space-y-2"><Label htmlFor="player-name">Display name</Label><Input id="player-name" autoComplete="nickname" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} placeholder="How your name appears to others" /><p className="text-xs text-slate-500">Required. Shown publicly. Profanity, slurs, and hate terms are not allowed.</p></div>
              <div className="space-y-2"><Label htmlFor="player-recovery-email">Email (optional)</Label><Input id="player-recovery-email" type="email" autoComplete="email" maxLength={254} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="you@example.com" /><p className="text-xs text-slate-500">Optional. Only used to recover your account, and must be verified before use. You can add it later.</p></div>
              <div className="space-y-2"><Label htmlFor="player-password">Password</Label><Input id="player-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /><p className="text-xs text-slate-500">Use 12–128 characters. Passwords are hashed before storage.</p></div>
              <div className="space-y-2"><Label htmlFor="player-confirm-password">Confirm password</Label><Input id="player-confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
              {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : "Create account"}</Button>
              <p className="text-center text-sm text-slate-600">Already have an account? <Link to="/player-login" className="font-medium text-[#0066cc] hover:underline">Sign in</Link></p>
            </form>
          ) : twoFactorStep ? (
            <form onSubmit={finishTwoFactor} className="mt-6 space-y-4">
              <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                {phoneSent ? "Enter the six-digit code from the text message we sent to your verified phone." : "Enter the current authenticator code or one unused recovery code."}
              </p>
              <div className="space-y-2"><Label htmlFor="player-two-factor-code">{phoneSent ? "Text-message code" : "Authenticator or recovery code"}</Label><Input id="player-two-factor-code" autoComplete="one-time-code" required value={resetCode} onChange={(event) => setResetCode(event.target.value.trim())} /></div>
              {phoneNote && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{phoneNote}</p>}
              {phoneVerified && !phoneSent && <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void requestPlayerPhoneCode()}>Send a code to my phone instead</Button>}
              {phoneSent && <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setPhoneSent(false); setResetCode(""); resetMessages(); }}>Use my authenticator app instead</button>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || !resetCode.trim()}>{busy ? "Verifying…" : "Verify and sign in"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setTwoFactorStep(false); setTwoFactorToken(""); setResetCode(""); setPhoneSent(false); resetMessages(); }}>Back to password</button>
            </form>
          ) : method === "email-code" ? (
            emailStep === "email" ? (
              <form onSubmit={requestEmailCode} className="mt-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="code-email">Account email</Label><Input id="code-email" type="email" autoComplete="email" required maxLength={254} value={login} onChange={(event) => setLogin(event.target.value)} placeholder="name@company.com" /></div>
                {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy || !login.trim()}>{busy ? "Sending code…" : "Email me a code"}</Button>
                <Button type="button" variant="outline" className="w-full" disabled={busy || !login.trim()} onClick={() => void requestRecoveryEmailDelivery()}>Send to my recovery email instead</Button>
                <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setMethod("password"); setEmailStep("email"); resetMessages(); }}>Use a password instead</button>
              </form>
            ) : emailStep === "two-factor" ? (
              <form onSubmit={finishEmailTwoFactor} className="mt-6 space-y-4">
                <p className="text-sm text-slate-600">{phoneSent ? "Enter the six-digit code from the text message we sent to your verified phone." : "This account has two-step verification. Enter a current authenticator code or an unused recovery code."}</p>
                <div className="space-y-2"><Label htmlFor="staff-authenticator-code">{phoneSent ? "Text-message code" : "Authenticator or recovery code"}</Label><Input id="staff-authenticator-code" autoComplete="one-time-code" required value={authenticatorCode} onChange={(event) => setAuthenticatorCode(event.target.value.trim().toUpperCase())} placeholder="Code" /></div>
                {phoneNote && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{phoneNote}</p>}
                {phoneVerified && !phoneSent && <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void requestStaffPhoneCode()}>Send a code to my phone instead</Button>}
                {phoneSent && <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setPhoneSent(false); setAuthenticatorCode(""); resetMessages(); }}>Use my authenticator app instead</button>}
                {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy || !authenticatorCode.trim()}>{busy ? "Verifying…" : "Verify and sign in"}</Button>
                <button type="button" className="w-full text-sm text-slate-500 hover:text-slate-900" onClick={() => { setEmailStep("code"); setAuthenticatorCode(""); setPhoneSent(false); setTwoFactorToken(""); resetMessages(); }}>Back to email code</button>
              </form>
            ) : (
              <form onSubmit={verifyEmailCode} className="mt-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="company-code">One-time code</Label><Input id="company-code" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" /></div>
                {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy || emailCode.length !== 6}>{busy ? "Verifying…" : "Sign in"}</Button>
                <button type="button" className="w-full text-sm text-slate-500 hover:text-slate-900" onClick={() => { setEmailStep("email"); setEmailCode(""); resetMessages(); }}>Use a different email</button>
              </form>
            )
          ) : (
            <form onSubmit={submitPassword} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="player-login">Username or email</Label><Input id="player-login" autoComplete="username" required value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Your username or account email" /></div>
              <div className="space-y-2"><Label htmlFor="player-password">Password</Label><Input id="player-password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("request"); resetMessages(); }}>Forgot password?</button>
              <button type="button" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => { setMethod("email-code"); setEmailStep("email"); resetMessages(); }}>
                Sign in with an email code instead
              </button>
              <p className="text-center text-sm text-slate-600">New to OpenWorlds? <Link to="/player-signup" className="font-medium text-[#0066cc] hover:underline">Create an account</Link></p>
            </form>
          )}

          <p className="mt-5 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">
            Staff and company accounts use this same sign-in. When a staff account is detected, extra security protections and a sign-in notice apply.
          </p>
        </div>
      </section>
    </main>
  );
}
