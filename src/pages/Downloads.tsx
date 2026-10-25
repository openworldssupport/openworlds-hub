import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, Laptop, Monitor, Terminal } from "lucide-react";

const platforms = [
  {
    name: "Windows",
    detail: "The OpenWorlds Launcher is currently unavailable. Check back here for updates.",
    icon: Monitor,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
  },
  {
    name: "macOS",
    detail: "No macOS launcher is listed in this release.",
    icon: Laptop,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
  },
  {
    name: "Linux",
    detail: "No Linux launcher is listed in this release.",
    icon: Terminal,
    tone: "bg-amber-50 text-[#987000]",
    accent: "border-t-[#f3c64e]",
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
            The OpenWorlds Launcher is currently unavailable. We’ll post an update here when it’s ready to download.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium text-white" aria-live="polite">Launcher currently unavailable</span>
            <a href="#builds" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Build details</a>
          </div>
        </div>
      </section>

      <section id="builds" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {platforms.map(({ name, detail, icon: Icon, tone, accent }) => (
            <article key={name} className={`rounded-xl border border-slate-200 border-t-2 bg-white p-5 ${accent}`}>
              <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 flex items-center justify-between gap-2 font-semibold">
                {name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/roadmap" className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <CalendarDays className="size-6 text-[#0066cc]" />
              <h3 className="mt-3 font-semibold">Watch the roadmap</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Check the roadmap for confirmed milestones.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0066cc]">Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
            <Link to="/news" className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <ArrowDownToLine className="size-6 text-[#7651c9]" />
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
        OpenWorlds © 2026 · Launcher currently unavailable
      </footer>
    </main>
  );
}
