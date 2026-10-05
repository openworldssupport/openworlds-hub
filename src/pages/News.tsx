import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight, CalendarClock, Flag, Megaphone, Newspaper, Rocket, Users, Youtube } from "lucide-react";

const publishTypes = [
  {
    icon: Rocket,
    tone: "bg-blue-50 text-[#0066cc]",
    accent: "border-t-[#0066cc]",
    title: "Release notes",
    text: "Release information will be posted when a build is available.",
  },
  {
    icon: CalendarClock,
    tone: "bg-violet-50 text-[#7651c9]",
    accent: "border-t-[#7651c9]",
    title: "Development updates",
    text: "Updates about development, when the team has verified details to share.",
  },
  {
    icon: Users,
    tone: "bg-amber-50 text-[#987000]",
    accent: "border-t-[#f3c64e]",
    title: "Community spotlights",
    text: "Community features may be published when a creator has agreed to be featured.",
  },
];

const follow = [
  { label: "Discord", href: "https://discord.gg/JWq5hEsKRX", text: "Visit the community Discord.", icon: Megaphone, tone: "bg-blue-50 text-[#0066cc]" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA", text: "Visit the OpenWorlds YouTube channel.", icon: Youtube, tone: "bg-violet-50 text-[#7651c9]" },
  { label: "Roadmap", to: "/roadmap", text: "Where each announcement sits in the bigger plan.", icon: Flag, tone: "bg-amber-50 text-[#987000]" },
];

function PublishedUpdates() {
  const updates = useQuery(api.staff.publicAnnouncements);

  if (updates === undefined) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading updates…</p>;
  }

  if (updates.length === 0) {
    return (
      <div className="flex max-w-3xl items-start gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#987000]">
          <Newspaper className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">No announcements yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The OpenWorlds team will publish official game updates here. Check back for release notes,
            development posts, event announcements, and news from the team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <article key={update._id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold capitalize text-[#0052a3]">
              {update.category === "development" ? "Development update" : update.category === "release" ? "Release notes" : update.category}
            </span>
            <time className="text-slate-400" dateTime={new Date(update.publishedAt).toISOString()}>
              {new Date(update.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
            </time>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{update.title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{update.summary}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{update.body}</p>
          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>Posted by {update.authorName}</span>
            {update.badge && <RoleBadge badge={update.badge} />}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function News() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">News &amp; announcements</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Official updates from the OpenWorlds team: builds, plans, and the occasional community win.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#publish" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">What we publish</a>
            <Link to="/roadmap" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">See the roadmap</Link>
          </div>
        </div>
      </section>

      <section id="publish" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7">
          <p className="text-sm font-medium text-[#7651c9]">What shows up here</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Three kinds of update</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {publishTypes.map(({ icon: Icon, tone, accent, title, text }) => (
            <article key={title} className={`rounded-xl border border-slate-200 border-t-2 bg-white p-5 ${accent}`}>
              <span className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#7651c9]">From the team</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Latest updates</h2>
            </div>
            <span className="hidden text-xs text-slate-400 sm:inline">Official OpenWorlds news</span>
          </div>
          <PublishedUpdates />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {follow.map(({ label, href, to, text, icon: Icon, tone }) => {
              const body = (
                <>
                  <span className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 flex items-center gap-1.5 font-semibold">
                    {label} <ArrowRight className="size-4" />
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </>
              );
              return to ? (
                <Link key={label} to={to} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  {body}
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {body}
                </a>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">
              Events <ArrowRight className="size-4" />
            </Link>
            <Link to="/support" className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Press &amp; partnership enquiries
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Official updates are published here first.
      </footer>
    </main>
  );
}
