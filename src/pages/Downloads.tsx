import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowDownToLine, ArrowRight, Bell, CalendarDays, Gamepad2, Laptop, Monitor, Terminal } from "lucide-react";

const platforms = [
  {
    name: "Windows",
    detail: "Platform compatibility has not been confirmed.",
    icon: Monitor,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
    status: "Not available",
    statusClass: "bg-blue-100 text-[#0052a3]",
  },
  {
    name: "macOS",
    detail: "Platform compatibility has not been confirmed.",
    icon: Laptop,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
    status: "Not confirmed",
    statusClass: "bg-violet-100 text-[#55409b]",
  },
  {
    name: "Linux",
    detail: "Platform compatibility has not been confirmed.",
    icon: Terminal,
    tone: "bg-amber-50 text-[#987000]",
    accent: "border-t-[#f3c64e]",
    status: "Not confirmed",
    statusClass: "bg-[#f3c64e]/30 text-[#7c5a00]",
  },
];

export default function Downloads() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">Play OpenWorlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Downloads</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            This page currently has no download links or confirmed platform requirements.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#builds" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">See platform status</a>
            <Link to="/roadmap" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Follow the roadmap</Link>
          </div>
        </div>
      </section>

      <section id="builds" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {platforms.map(({ name, detail, icon: Icon, tone, accent, status, statusClass }) => (
            <article key={name} className={`rounded-xl border border-slate-200 border-t-2 bg-white p-5 ${accent}`}>
              <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 flex items-center justify-between gap-2 font-semibold">
                {name}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>{status}</span>
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <ArrowDownToLine className="size-4" /> Build not published yet
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-[#f3c64e] bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#f3c64e]/25 text-[#7c5a00]">
                <Gamepad2 className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">No official downloads available right now</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  OpenWorlds is still in development. No download links have been published here. Treat any external build as unverified unless its source is independently confirmed.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Link to="/roadmap" className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <CalendarDays className="size-6 text-[#0066cc]" />
              <h3 className="mt-3 font-semibold">Watch the roadmap</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Check the roadmap for confirmed milestones.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0066cc]">Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
            <Link to="/news" className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <Bell className="size-6 text-[#7651c9]" />
              <h3 className="mt-3 font-semibold">Release notes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Published updates will appear on the News page.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#7651c9]">Read news <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
            <Link to="/support" className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <ArrowDownToLine className="size-6 text-[#987000]" />
              <h3 className="mt-3 font-semibold">Install help</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Have a question about downloads? Use the support form.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#987000]">Get help <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026
      </footer>
    </main>
  );
}
