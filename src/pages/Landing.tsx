import { motion } from "framer-motion";
import { ArrowRight, Globe2, Gamepad2, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-3" aria-label="OpenWorlds home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#2468e8] text-white">
            <Globe2 className="size-6" strokeWidth={1.8} />
          </span>
          <span className="text-sm font-bold tracking-[0.18em]">OPENWORLDS</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/auth" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white">Log in</Link>
          <Link to="/create-account" className="rounded-xl bg-[#2468e8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d58cc]">Create account</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1fr_0.92fr] lg:px-12 lg:pb-28 lg:pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-semibold text-[#2468e8]">
            <Gamepad2 className="size-4" /> THE COMPANION FOR OPENWORLDS PLAYERS
          </div>
          <h1 className="max-w-2xl text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
            One account.<br />Your <span className="text-[#2468e8]">OpenWorlds.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Your place for OpenWorlds game news and downloads. Sign in with the account you already use in the game — no separate website account.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2468e8] px-6 text-sm font-semibold text-white transition hover:bg-[#1d58cc]">
              Log in to OpenWorlds <ArrowRight className="size-4" />
            </Link>
            <Link to="/create-account" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Create an account in game
            </Link>
          </div>
          <div className="mt-7 flex items-start gap-2.5 text-sm leading-6 text-slate-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2468e8]" />
            <span>Shared account sign-in is being prepared. We won’t ask you to create a duplicate account here.</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.08 }} className="relative mx-auto w-full max-w-[550px]">
          <div className="absolute -right-5 -top-5 size-28 rounded-full bg-[#f5c84c]/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[30px] bg-[#2468e8] p-6 text-white sm:p-8">
            <div className="absolute -right-20 -top-20 size-72 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-5 size-48 rounded-full border border-white/10" />
            <div className="relative flex min-h-[320px] flex-col justify-between sm:min-h-[390px]">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><Globe2 className="size-7" /></div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-blue-50">GAME ↔ WEBSITE</span>
              </div>
              <div className="mx-auto flex size-44 items-center justify-center rounded-full border border-white/25 bg-white/[0.07] shadow-[0_0_0_22px_rgba(255,255,255,0.035)] sm:size-52">
                <Globe2 className="size-32 text-white sm:size-40" strokeWidth={0.9} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">The official web companion</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One OpenWorlds identity.</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">Connected to the game account service when it’s ready.</p>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>OPENWORLDS · OFFICIAL GAME COMPANION</span>
          <span>One OpenWorlds account. One OpenWorlds community.</span>
        </div>
      </footer>
    </main>
  );
}
