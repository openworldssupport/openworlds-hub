import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, useLocation, useNavigate } from "react-router";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "create" | "player-login" | "player-signup";

interface AuthProps {
  mode?: AuthMode;
}

export default function AuthPage({ mode = "login" }: AuthProps) {
  if (mode === "player-login" || mode === "player-signup") {
    return <PlayerAccountNotice mode={mode} />;
  }
  return <StaffAuthPage mode={mode} />;
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

function PlayerAccountNotice({ mode }: { mode: "player-login" | "player-signup" }) {
  const isSignup = mode === "player-signup";
  const { signIn } = useAuthActions();
  const passwordSignIn = useAction(api.accountSecurity.passwordSignIn);
  const completePasswordSignIn = useAction(api.accountSecurity.completePasswordSignIn);
  const requestRecoveryEmailCode = useMutation(api.playerRecovery.requestRecoveryEmailCode);
  const beginPasswordReset = useAction(api.playerRecovery.beginPasswordReset);
  const resetPassword = useAction(api.playerRecovery.resetPassword);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [resetStep, setResetStep] = useState<"closed" | "request" | "verify">("closed");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        if (!recoveryEmail.trim()) {
          setError("A recovery email is required. Enter an email address you can access.");
          setBusy(false);
          return;
        }
        const result = await signIn("player-password", {
          flow: "signUp",
          email: login.trim().toLowerCase(),
          name: name.trim(),
          recoveryEmail: recoveryEmail.trim(),
          password,
        });
        if (!result.signingIn) throw new Error("Player account creation did not complete.");
      } else {
        const result = await passwordSignIn({ login: login.trim().toLowerCase(), password });
        if (result.required) {
          setTwoFactorToken(result.token ?? "");
          if (!result.recoveryEmailVerified) {
            await signIn("player-password", {
              flow: "twoFactorSignIn",
              email: login.trim().toLowerCase(),
              password,
              twoFactorToken: result.token ?? "",
            });
            navigate("/dashboard", { replace: true });
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
      }
      if (isSignup) {
        try {
          await requestRecoveryEmailCode({ email: recoveryEmail.trim() });
          setNotice("Your account is saved. We sent a verification code to your recovery email. Verify it to continue.");
        } catch {
          setNotice("Your account is saved, but we could not send the verification code. You can correct the email or request another code on the verification screen.");
        }
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate(destination, { replace: true });
    } catch {
      setError(isSignup ? "Could not create your account. Check your details; this username or email may already be registered." : "Username/email or password is incorrect.");
    } finally {
      setBusy(false);
    }
  }

  async function finishTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await completePasswordSignIn({ login: login.trim().toLowerCase(), token: twoFactorToken, code: resetCode.trim().toUpperCase() });
      const signInResult = await signIn("player-password", {
        flow: "twoFactorSignIn",
        email: login.trim().toLowerCase(),
        password,
        twoFactorToken,
      });
      if (!signInResult.signingIn) throw new Error("Two-step sign-in did not complete.");
      navigate(destination, { replace: true });
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not verify the authenticator code.");
    } finally { setBusy(false); }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await beginPasswordReset({ login: login.trim().toLowerCase() });
      setResetStep("verify");
      setNotice("If the account has a verified recovery email, a code will be sent there.");
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
    setError("");
    setNotice("");
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <OpenWorldsLogo />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7651c9]">OpenWorlds player account</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{resetStep !== "closed" ? "Reset your password" : isSignup ? "Create your player account" : "Player sign in"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{resetStep !== "closed" ? "Use your username or email address and a verified recovery email." : isSignup ? "Use a username, password, and a recovery email. You’ll need to verify the email before using your player account." : "Sign in to access your player profile and saved game progress. If your recovery email is not verified yet, you’ll be prompted to verify one."}</p>
          {twoFactorStep ? (
            <form onSubmit={finishTwoFactor} className="mt-6 space-y-4">
              <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Enter the current authenticator code or one unused recovery code.</p>
              <div className="space-y-2"><Label htmlFor="player-two-factor-code">Authenticator or recovery code</Label><Input id="player-two-factor-code" autoComplete="one-time-code" required value={resetCode} onChange={(event) => setResetCode(event.target.value.trim())} /></div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || !resetCode.trim()}>{busy ? "Verifying…" : "Verify and sign in"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setTwoFactorStep(false); setTwoFactorToken(""); setResetCode(""); }}>Back to password</button>
            </form>
          ) : resetStep === "request" ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="reset-login">Username or email</Label><Input id="reset-login" autoComplete="username" required value={login} onChange={(event) => setLogin(event.target.value)} /></div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Requesting…" : "Send recovery code"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("closed"); setError(""); }}>Back to sign in</button>
            </form>
          ) : resetStep === "verify" ? (
            <form onSubmit={finishReset} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="reset-code">6-digit recovery code</Label><Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
              <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
              {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || resetCode.length !== 6}>{busy ? "Updating…" : "Set new password"}</Button>
              <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("request"); setError(""); }}>Request another code</button>
            </form>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {isSignup && <div className="space-y-2"><Label htmlFor="player-name">Player name</Label><Input id="player-name" autoComplete="nickname" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} /></div>}
              <div className="space-y-2"><Label htmlFor="player-login">Username or email</Label><Input id="player-login" autoComplete="username" required minLength={3} maxLength={254} value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Choose a username" /><p className="text-xs text-slate-500">Username: 3–24 letters, numbers, dots, hyphens or underscores. Email addresses also work.</p></div>
              {isSignup && <div className="space-y-2"><Label htmlFor="player-recovery-email">Recovery email</Label><Input id="player-recovery-email" type="email" autoComplete="email" required maxLength={254} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="you@example.com" /><p className="text-xs text-slate-500">Required. We’ll send a code to verify this address before you can use your player account.</p></div>}
              <div className="space-y-2"><Label htmlFor="player-password">Password</Label><Input id="player-password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />{isSignup && <p className="text-xs text-slate-500">Use 12–128 characters. Passwords are hashed before storage.</p>}</div>
              {isSignup && <div className="space-y-2"><Label htmlFor="player-confirm-password">Confirm password</Label><Input id="player-confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>}
              {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</Button>
              {!isSignup && <button type="button" className="w-full text-sm text-[#0066cc] hover:underline" onClick={() => { setResetStep("request"); setError(""); setNotice(""); }}>Forgot password?</button>}
            </form>
          )}
          {resetStep === "closed" && <p className="mt-5 text-center text-sm text-slate-600">{isSignup ? "Already have an account? " : "New to OpenWorlds? "}<Link to={isSignup ? "/player-login" : "/player-signup"} className="font-medium text-[#0066cc] hover:underline">{isSignup ? "Sign in" : "Create an account"}</Link></p>}
          <p className="mt-5 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">Player accounts are separate from company staff access. <Link to="/auth?returnTo=%2Fstaff" className="font-medium text-[#0066cc] hover:underline">Staff sign in</Link></p>
        </div>
      </section>
    </main>
  );
}

function StaffAuthPage({ mode = "login" }: AuthProps) {
  const { signIn } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const isCreate = mode === "create";
  const isStaffSignup = params.get("mode") === "staff-signup" && destination === "/staff";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase() });
      setStep("code");
    } catch (err) {
      setError("Could not send a sign-in code. If this account is eligible, try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase(), code: code.trim() });
      navigate(destination, { replace: true });
    } catch (err) {
      setError("That code could not be verified. Check it and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <OpenWorldsLogo />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7651c9]">
            OpenWorlds company
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {isCreate
              ? "Public sign-up is closed"
              : isStaffSignup
                ? "Staff account sign up"
                : step === "email"
                  ? "Staff account sign in"
                  : "Check your email"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isCreate
              ? "Public player accounts and sign-up are coming soon. Company staff accounts sign in with a verified staff email and one-time code."
              : step === "email"
                ? isStaffSignup
                  ? "Use your company-approved email. We’ll check its staff eligibility and send a one-time code."
                  : "Enter your staff email. We’ll send a one-time code."
                : `A one-time code was sent to the email address you entered. The code expires after 15 minutes.`}
          </p>

          {isCreate ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Need company access? Ask an OpenWorlds admin to invite your email address. No public player account is created here.
            </div>
          ) : step === "email" ? (
            <form onSubmit={requestCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-email" className="text-sm font-medium">
                  Staff email
                </label>
                <Input
                  id="company-email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              {error && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending code…" : "Email me a code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-code" className="text-sm font-medium">
                  One-time code
                </label>
                <Input
                  id="company-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                />
              </div>
              {error && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={busy || code.length !== 6}
              >
                {busy ? "Verifying…" : isStaffSignup ? "Create staff access" : "Sign in"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            <Link to="/" className="font-medium text-[#0066cc] hover:underline">
              Back to OpenWorlds
            </Link>
            {!isCreate && <span className="mx-2">·</span>}
            {!isCreate && (
              <Link to="/create-account" className="hover:underline">
                Public sign-up unavailable
              </Link>
            )}
            {!isCreate && !isStaffSignup && <span className="mx-2">·</span>}
            {!isCreate && !isStaffSignup && (
              <Link
                to="/auth?mode=staff-signup&returnTo=%2Fstaff"
                className="hover:underline"
              >
                Staff sign up
              </Link>
            )}
            {isCreate && <span className="mx-2">·</span>}
            {isCreate && (
              <Link to="/auth?returnTo=%2Fstaff" className="font-medium text-[#0066cc] hover:underline">
                Staff sign in
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
