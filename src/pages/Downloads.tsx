import { SiteNav } from "@/components/SiteNav";
import { ArrowDownToLine } from "lucide-react";

export default function Downloads() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">Play OpenWorlds</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Downloads</h1>
          <p className="mt-3 max-w-xl text-blue-50">Official game downloads.</p>
        </div>
      </section>
      <section className="mx-auto min-h-[45vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex max-w-2xl items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#987000]"><ArrowDownToLine className="size-5" /></span>
          <div><h2 className="font-medium">No official downloads available right now.</h2></div>
        </div>
      </section>
    </main>
  );
}
