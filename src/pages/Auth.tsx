import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, KeyRound, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthProps {
  mode?: "login" | "create";
}

export default function AuthPage({ mode = "login" }: AuthProps) {
  const { signIn } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const isCreate = mode === "create";
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
      setError(err instanceof Error ? err.message : "Could not send a sign-in code.");
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
      setError(err instanceof Error ? err.message : "That code was not accepted.");
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
            {isCreate ? <AlertCircle className="size-5" /> : step === "email" ? <Mail className="size-5" /> : <KeyRound className="size-5" />}
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7651c9]">OpenWorlds company</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {isCreate ? "Public sign-up is closed" : step === "email" ? "Company sign in" : "Check your email"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isCreate
              ? "Player accounts and public sign-up are not available on this website yet. Company accounts are created by an admin invitation."
              : step === "email"
                ? "Enter the email address an OpenWorlds admin invited. We’ll send a one-time code; there is no password."
                : `Enter the one-time code sent to ${email}. The code expires after 15 minutes.`}
          </p>

          {isCreate ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Need company access? Ask an OpenWorlds admin to invite your email address. No public account is created here.
            </div>
          ) : step === "email" ? (
            <form onSubmit={requestCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-email" className="text-sm font-medium">Invited company email</label>
                <Input id="company-email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
              </div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending code…" : "Email me a code"}</Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-code" className="text-sm font-medium">One-time code</label>
                <Input id="company-code" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" />
              </div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Sign in"}</Button>
              <button type="button" className="w-full text-sm text-slate-500 hover:text-slate-900" onClick={() => { setStep("email"); setCode(""); setError(""); }}>Use a different email</button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            <Link to="/" className="font-medium text-[#0066cc] hover:underline">Back to OpenWorlds</Link>
            {!isCreate && <span className="mx-2">·</span>}
            {!isCreate && <Link to="/create-account" className="hover:underline">Public sign-up unavailable</Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
