import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react";

export default function Worlds() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">Worlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Made for exploring
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Community worlds will appear here once they are real and ready to share. We won’t fill the
            shelf with made-up examples.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-7 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]">
              <Compass className="size-6" />
            </span>
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck className="size-4" /> Verified listings only
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">No worlds published yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                There aren’t any confirmed community worlds to feature right now. When actual worlds are
                available and approved to share, this page will show their details here.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/learning"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]"
                >
                  Explore learning <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/community"
                  className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Visit community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Community worlds will be listed when available.
      </footer>
    </main>
  );
}
