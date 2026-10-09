import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, KeyRound, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function PlayerAccountNotice({ mode }: { mode: "player-login" | "player-signup" }) {
  const isSignup = mode === "player-signup";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
            <AlertCircle className="size-5" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7651c9]">
            OpenWorlds player account
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {isSignup ? "Player sign-up is coming soon" : "Player log in is coming soon"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Player sign up and player log in are coming soon. When they are active, you can create a player account
            or sign in to the game-side profile here.
          </p>
          <div role="status" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Player {isSignup ? "sign-up" : "log in"} is coming soon.
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to={isSignup ? "/player-login" : "/player-signup"}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]"
            >
              {isSignup ? "Player log in" : "Player sign up"} · coming soon
            </Link>
            <Link to="/" className="inline-flex h-10 items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-900">
              Back to OpenWorlds
            </Link>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            Company staff?{" "}
            <Link to="/auth?returnTo=%2Fstaff" className="font-medium text-[#0066cc] hover:underline">
              Staff sign in
            </Link>
          </div>
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
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
            {isCreate ? (
              <AlertCircle className="size-5" />
            ) : step === "email" ? (
              <Mail className="size-5" />
            ) : (
              <KeyRound className="size-5" />
            )}
          </span>
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
                : `Enter the one-time code sent to ${email}. The code expires after 15 minutes.`}
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
