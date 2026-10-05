import { SiteNav } from "@/components/SiteNav";
import { motion } from "framer-motion";
import { ArrowDownToLine, Gamepad2, Megaphone, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7651c9]"><Gamepad2 className="size-4" /> Player home</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">This member area is not connected to shared game-account data yet.</p>
        </motion.div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-[#7651c9]"><Megaphone className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Game news</h2><p className="text-xs text-slate-400">Official OpenWorlds updates</p></div>
            </div>
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">No news published here yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">There are no published announcements to show here yet. See the public News page for updates.</p>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-[#987000]"><ArrowDownToLine className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Game downloads</h2><p className="text-xs text-slate-400">Official builds only</p></div>
            </div>
            <div className="mt-8 rounded-xl bg-[#f5f7fb] p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500"><span className="size-1.5 rounded-full bg-amber-400" /> No official links</span>
              <p className="mt-4 text-sm font-medium text-slate-800">Download details aren’t published here yet.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Download links will be added once an official build is available.</p>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Availability and system requirements will be shown when officially confirmed.</div>
          </motion.section>
        </div>


      </div>
    </main>
  );
}
