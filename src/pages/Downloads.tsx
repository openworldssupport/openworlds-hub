import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowDownToLine, ArrowRight, CalendarDays, Gamepad2, Laptop, Monitor, Terminal } from "lucide-react";

const platforms = [
  {
    name: "Windows",
    detail: "Platform compatibility has not been confirmed.",
    icon: Monitor,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
  },
  {
    name: "macOS",
    detail: "Platform compatibility has not been confirmed.",
    icon: Laptop,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
  },
  {
    name: "Linux",
    detail: "Platform compatibility has not been confirmed.",
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
            The Windows launcher is being prepared. We’ll activate the download when the official installer is ready.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#builds" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">See platform status</a>
            <Link to="/roadmap" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Follow the roadmap</Link>
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
                  <Gamepad2 className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">OpenWorlds Launcher for Windows</h2>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-[#7c5a00]">Coming soon</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The installer is not available yet. When published, it will be available at <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs">/downloads/launcher/OpenWorldsLauncher.exe</code>.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Expected SHA-256: <code className="break-all">dc126b3f7cd9641ea1a95e2598b7869223a7634baa0cff493974399a5c4769cc</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-5 text-sm font-semibold text-slate-500"
              >
                <ArrowDownToLine className="size-4" />
                Download not available yet
              </button>
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
        OpenWorlds © 2026
      </footer>
    </main>
  );
}
