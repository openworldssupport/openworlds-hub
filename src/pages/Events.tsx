import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, Mic2, PartyPopper, Trophy } from "lucide-react";

const upcoming = [
  {
    date: "18 Oct",
    kind: "Build contest",
    kindClass: "bg-[#f3c64e]/25 text-[#7c5a00] border-[#f3c64e]/50",
    title: "Tiny Worlds Challenge",
    text: "Build an entire world inside a single 32×32 plot. Three days, one theme, community vote on the winner.",
    icon: Trophy,
    tone: "bg-amber-50 text-[#987000]",
  },
  {
    date: "25 Oct",
    kind: "Community stream",
    kindClass: "bg-blue-50 text-[#0066cc] border-blue-100",
    title: "Creator Spotlight Live",
    text: "We walk through submitted worlds with their creators, live on the official YouTube channel.",
    icon: Mic2,
    tone: "bg-blue-50 text-[#0066cc]",
  },
  {
    date: "08 Nov",
    kind: "Playtest",
    kindClass: "bg-violet-50 text-[#7651c9] border-violet-100",
    title: "Alpha Weekend",
    text: "A guided group playtest of the newest creator tools. Seats are limited to keep feedback readable.",
    icon: PartyPopper,
    tone: "bg-violet-50 text-[#7651c9]",
  },
];

const recurring = [
  { title: "Build night", cadence: "Every Wednesday", text: "Open voice channel, shared theme, and a lot of half-finished worlds." },
  { title: "Show & tell", cadence: "First Sunday", text: "Post what you made this month and get feedback from other creators." },
  { title: "Newcomer welcome", cadence: "Every Friday", text: "A hosted session for first-time players: controls, building, and where to start." },
];

export default function Events() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">Events</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Things worth showing up for</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Contests, playtests, and streams run by the OpenWorlds team and community hosts. Free, open, and
            always optional.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#upcoming" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Upcoming events</a>
            <Link to="/community" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Get reminders</Link>
          </div>
        </div>
      </section>

      <section id="upcoming" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-[#7651c9]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coming up</h2>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {upcoming.map(({ date, kind, kindClass, title, text, icon: Icon, tone }) => (
            <article key={title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${kindClass}`}>{date}</span>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{kind}</span>
              </div>
              <div className={`mt-5 flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{text}</p>
              <Link to="/community" className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">
                Take part <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Happening every week</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">No sign-up, no entry fee. Turn up when you can.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {recurring.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-xl border bg-white p-5 ${
                  index === 0
                    ? "border-t-2 border-t-[#0066cc]"
                    : index === 1
                      ? "border-t-2 border-t-[#7651c9]"
                      : "border-t-2 border-t-[#f3c64e]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.cadence}</p>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-6 rounded-xl border border-slate-200 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Hosting something?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Community-run nights are welcome. Tell us what you are planning and we will help with the
              announcement, the stream slot, or a prize.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Link to="/support" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Pitch an event <ArrowRight className="size-4" /></Link>
            <Link to="/rules" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Read the rules</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All events are free and optional.
      </footer>
    </main>
  );
}
