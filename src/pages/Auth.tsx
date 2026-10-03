import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

interface AuthProps {
  mode?: "login" | "create";
}

export default function AuthPage({ mode = "login" }: AuthProps) {
  const isCreate = mode === "create";

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1280px] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white lg:min-h-[calc(100vh-4rem)] lg:flex-row">
        <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#2468e8] px-7 py-7 text-white sm:px-10 sm:py-9 lg:min-h-[700px] lg:w-[47%] lg:px-14 lg:py-12">
          <div className="absolute -right-24 -top-32 size-[420px] rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-12 size-[280px] rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-24 size-[380px] rounded-full bg-[#78a8ff]/20 blur-3xl" />

          <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3" aria-label="OpenWorlds home">
            <span className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <Globe2 className="size-6" strokeWidth={1.8} />
            </span>
            <span className="text-sm font-semibold tracking-[0.2em]">OPENWORLDS</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-lg py-10 lg:py-0"
          >
            <div className="mb-7 flex size-[72px] items-center justify-center rounded-[22px] border border-white/20 bg-white/10 sm:size-[88px]">
              <Globe2 className="size-12 sm:size-14" strokeWidth={1.25} />
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">One identity. Every world.</p>
            <h1 className="max-w-[540px] text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
              Your world is waiting.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100 sm:text-lg">
              The home for your OpenWorlds game account, news and downloads — built to connect with the game you already play.
            </p>
          </motion.div>

          <div className="relative z-10 hidden items-center gap-2 text-xs text-blue-100 lg:flex">
            <ShieldCheck className="size-4" />
            <span>Official OpenWorlds account connection is being prepared.</span>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="w-full max-w-[420px]"
          >
            <Link to="/" className="mb-9 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
              <ArrowLeft className="size-4" /> OpenWorlds home
            </Link>

            {isCreate ? (
              <>
                <div className="mb-8">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#2468e8]">For existing players</p>
                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">Create your account</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Your OpenWorlds identity starts in the game — no separate website account.</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white text-[#2468e8]">
                    <Globe2 className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">Create it in OpenWorlds</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Website account creation isn’t connected yet. Create your OpenWorlds account in the game, then use those same details here when shared sign-in is available.
                  </p>
                </div>
                <Link to="/auth" className="mt-6 block">
                  <Button className="h-11 w-full rounded-xl bg-[#2468e8] hover:bg-[#1d58cc]">Go to log in <ArrowRight className="ml-2 size-4" /></Button>
                </Link>
                <p className="mt-5 text-center text-xs leading-5 text-slate-400">No duplicate account is created on this website.</p>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#2468e8]">Welcome back, player</p>
                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">Log in to OpenWorlds</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Use the account you created in the OpenWorlds game.</p>
                </div>

                <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="identity" className="text-sm font-medium text-slate-700">Username or email</label>
                    <Input id="identity" name="identity" autoComplete="username" placeholder="Your OpenWorlds username or email" className="h-12 rounded-xl border-slate-200 bg-white px-4 focus-visible:ring-[#2468e8]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-4 focus-visible:ring-[#2468e8]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Checkbox id="remember" disabled className="data-[state=checked]:bg-[#2468e8]" /> Remember this device
                    </label>
                    <span className="text-xs text-slate-400">Recovery not connected</span>
                  </div>

                  <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
                    Shared game-account sign-in isn’t connected yet. Your details won’t be sent or stored.
                  </div>
                  <Button type="submit" disabled className="h-12 w-full rounded-xl bg-[#2468e8] text-sm font-semibold hover:bg-[#1d58cc]">
                    Log in <ArrowRight className="ml-2 size-4" />
                  </Button>
                </form>
                <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
                  New to OpenWorlds? <Link to="/create-account" className="font-semibold text-[#2468e8] hover:text-[#1d58cc]">Create an account</Link>
                </div>
                <p className="mt-5 text-center text-xs leading-5 text-slate-400">Forgot your password? Account recovery will be available when the official account service is connected.</p>
              </>
            )}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
