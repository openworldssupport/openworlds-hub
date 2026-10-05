import { ArrowRight, CalendarDays, Compass, Flag, Gamepad2, LifeBuoy, Mail, Map, Newspaper } from "lucide-react";
import { Link } from "react-router";
import { SiteNav } from "@/components/SiteNav";

const explore = [
  {
    to: "/worlds",
    title: "Worlds",
    text: "Browse worlds built and shared by the community.",
    icon: Compass,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
  },
  {
    to: "/events",
    title: "Events",
    text: "Confirmed OpenWorlds events, when announced.",
    icon: CalendarDays,
    tone: "bg-amber-50 text-[#987000]",
    accent: "border-t-[#f3c64e]",
  },
  {
    to: "/roadmap",
    title: "Roadmap",
    text: "See what we are building next, phase by phase.",
    icon: Flag,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
  },
  {
    to: "/learning",
    title: "Learning",
    text: "Guides and lessons for building your first world.",
    icon: Map,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
  },
  {
    to: "/news",
    title: "News",
    text: "Release notes and updates from the team.",
    icon: Newspaper,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
  },
  {
    to: "/rules",
    title: "Rules",
    text: "How we keep the community safe and welcoming.",
    icon: Gamepad2,
    tone: "bg-amber-50 text-[#987000]",
    accent: "border-t-[#f3c64e]",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <Gamepad2 className="size-4" /> OpenWorlds
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            A world built together.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
            Create, share, and explore. Follow the project, meet the community, or help us build what comes
            next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/community"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50"
            >
              Join the community <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/careers"
              className="inline-flex h-11 items-center rounded-lg border border-white/50 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore careers
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-blue-100">
            <Link to="/downloads" className="hover:text-white">Downloads</Link>
            <span aria-hidden="true" className="text-white/40">·</span>
            <Link to="/support" className="hover:text-white">Support</Link>
            <span aria-hidden="true" className="text-white/40">·</span>
            <Link to="/roadmap" className="hover:text-white">Roadmap</Link>
            <span aria-hidden="true" className="text-white/40">·</span>
            <Link to="/worlds" className="hover:text-white">Worlds</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7651c9]">Explore</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Everything in one place</h2>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">
            About OpenWorlds <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {explore.map(({ to, title, text, icon: Icon, tone, accent }) => (
            <Link
              key={to}
              to={to}
              className={`group rounded-xl border border-slate-200 border-t-2 bg-white p-5 ${accent} transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 flex items-center gap-1.5 font-semibold">
                {title}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
              <Flag className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Careers</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No confirmed contributor openings are listed yet.
            </p>
            <Link to="/careers" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">
              Careers information <ArrowRight className="size-4" />
            </Link>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]">
              <LifeBuoy className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Need a hand?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Find answers, open a support ticket, or check the status of one you already sent.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium text-[#0066cc]">
              <Link to="/support" className="hover:underline">Visit support</Link>
              <a href="mailto:support@openworlds.dk" className="inline-flex items-center gap-1 hover:underline">
                <Mail className="size-4" /> Email us
              </a>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]">
              <CalendarDays className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Events</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check for event announcements confirmed by the team.
            </p>
            <Link to="/events" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">
              See events <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="rounded-xl border border-[#f3c64e] bg-[#f3c64e]/10 p-6 sm:p-8">
          <p className="text-sm font-medium text-[#7c5a00]">In development</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            OpenWorlds is not released yet — and that is the best time to shape it.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            OpenWorlds is in development. Confirmed public updates will appear on the News page.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/roadmap" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">
              View the roadmap <ArrowRight className="size-4" />
            </Link>
            <Link to="/downloads" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Downloads
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm text-slate-500 sm:px-8">
          <span>OpenWorlds © 2026. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Discord</a>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">YouTube</a>
            <Link to="/rules" className="hover:text-slate-900">Rules</Link>
            <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
