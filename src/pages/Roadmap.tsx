import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, Flag, Gauge, MessageSquareText, Sparkles } from "lucide-react";

const phases = [
  {
    status: "Shipped",
    statusClass: "bg-blue-50 text-[#0066cc] border-blue-100",
    title: "Foundation",
    window: "Phase 1",
    summary: "Core world engine, movement, building blocks, and the first internal test builds.",
    items: ["World streaming and saving", "Building and editing tools", "Multiplayer sync basics"],
  },
  {
    status: "In progress",
    statusClass: "bg-[#f3c64e]/25 text-[#7c5a00] border-[#f3c64e]/50",
    title: "Alpha",
    window: "Phase 2",
    summary: "Creator tools open up, early community tests begin, and the first worlds are shared publicly.",
    items: ["Creator toolkit and publishing", "Community playtests", "Moderation and reporting tools"],
  },
  {
    status: "Planned",
    statusClass: "bg-violet-50 text-[#7651c9] border-violet-100",
    title: "Beta",
    window: "Phase 3",
    summary: "Wider invites, accounts and profiles, and the economy of worlds people actually live in.",
    items: ["Profiles and friends lists", "World discovery and search", "Performance and console passes"],
  },
  {
    status: "Planned",
    statusClass: "bg-violet-50 text-[#7651c9] border-violet-100",
    title: "Open launch",
    window: "Phase 4",
    summary: "OpenWorlds opens to everyone, with creator rewards and the tools the community asked for.",
    items: ["Public release", "Creator programme", "Seasonal community events"],
  },
];

const priorities = [
  {
    icon: Gauge,
    tone: "bg-blue-50 text-[#0066cc]",
    title: "Playable first",
    text: "We ship the thing you can touch before the thing that looks good in a trailer.",
  },
  {
    icon: MessageSquareText,
    tone: "bg-violet-50 text-[#7651c9]",
    title: "Built with feedback",
    text: "Playtest notes, Discord threads, and support tickets all feed the same priority list.",
  },
  {
    icon: Sparkles,
    tone: "bg-amber-50 text-[#987000]",
    title: "Small, steady releases",
    text: "Frequent updates keep the game stable instead of one giant risky launch.",
  },
];

export default function Roadmap() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">Roadmap</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Where OpenWorlds is heading</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            A public view of the phases we are working through. Dates shift, but the direction does not:
            more tools for creators, more reasons to come back.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#phases" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">See the phases</a>
            <Link to="/news" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Follow the updates</Link>
          </div>
        </div>
      </section>

      <section id="phases" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3">
          <Flag className="size-5 text-[#7651c9]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Development phases</h2>
        </div>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">Each phase has to earn the next one. Nothing moves forward just because a calendar says so.</p>

        <ol className="mt-8 space-y-5">
          {phases.map((phase, index) => (
            <li key={phase.title} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  index === 0 ? "bg-[#0066cc]" : index === 1 ? "bg-[#f3c64e]" : "bg-[#7651c9]"
                }`}
              />
              <div className="flex flex-wrap items-center gap-3 pl-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${phase.statusClass}`}>{phase.status}</span>
                <span className="text-xs font-medium text-slate-500">{phase.window}</span>
                <h3 className="text-lg font-semibold">{phase.title}</h3>
              </div>
              <p className="mt-3 pl-3 text-sm leading-6 text-slate-600">{phase.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2 pl-3">
                {phase.items.map((item) => (
                  <li key={item} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How we choose what comes next</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {priorities.map(({ icon: Icon, tone, title, text }) => (
              <article key={title} className="rounded-xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-5">
                <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Want a say in what we build?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Roadmap items come from real playtest feedback. Join the community, tell us what broke, and vote on what
            lands in the next phase.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/community" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Join the community <ArrowRight className="size-4" /></Link>
            <Link to="/news" className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Read release notes</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Roadmap is indicative, not a promise of dates.
      </footer>
    </main>
  );
}
