import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { SiteNav } from "@/components/SiteNav";

interface AuthProps {
  mode?: "login" | "create";
}

export default function AuthPage({ mode = "login" }: AuthProps) {
  const isCreate = mode === "create";
  const [attempted, setAttempted] = useState(false);
  const errorCode = isCreate ? "OW-AUTH-001" : "OW-AUTH-002";
  const errorTitle = isCreate ? "Account creation unavailable" : "Login unavailable";
  const errorMessage = isCreate
    ? "OpenWorlds account creation is not connected yet. This is a temporary website notice, not a server error; no account was created."
    : "Shared game account login is not connected yet. This is a temporary website notice, not a server error. Your sign-in details were not sent or stored.";

  const handleAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
  };

  const handleCreateAttempt = () => {
    setAttempted(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />

      <div className="mx-auto flex max-w-5xl justify-center px-5 py-12 sm:px-8 sm:py-20">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-sm font-medium text-[#7651c9]">{isCreate ? "New player" : "Existing players"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{isCreate ? "Create an account" : "Log in"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isCreate ? "OpenWorlds accounts are created in the game. You won't need a separate website account." : "Use the same account details you use in the OpenWorlds game."}
          </p>

          {isCreate ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-violet-100 bg-gradient-to-r from-violet-50 to-amber-50 p-4">
                <p className="text-sm font-medium">Create your account in the game</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Website account creation is not connected yet. Your account will work here once the shared service is ready.</p>
              </div>
              <Button type="button" onClick={handleCreateAttempt} className="h-11 w-full rounded-lg bg-[#0066cc]">Create account</Button>
            </div>
          ) : (
            <form onSubmit={handleAttempt} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="identity" className="text-sm font-medium">Username or email</label>
                <Input id="identity" name="identity" autoComplete="username" placeholder="Username or email" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Password" className="h-11 rounded-lg" />
              </div>
              <Button type="submit" className="h-11 w-full rounded-lg bg-[#0066cc]">Log in</Button>
              <p className="text-center text-xs text-slate-500">Password recovery will be available when account login is connected.</p>
            </form>
          )}

          {attempted && (
            <div role="alert" className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-red-900">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{errorTitle}</p>
                <p className="mt-1 text-sm leading-5">{errorMessage}</p>
                <p className="mt-2 font-mono text-xs">Website error code: {errorCode}</p>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            {isCreate ? <>Already have an account? <Link to="/auth" className="font-medium text-[#7651c9] hover:underline">Log in</Link></> : <>New to OpenWorlds? <Link to="/create-account" className="font-medium text-[#7651c9] hover:underline">Create an account</Link></>}
          </div>
        </section>
      </div>
    </main>
  );
}
