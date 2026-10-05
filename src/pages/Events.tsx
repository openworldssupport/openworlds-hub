import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight, CalendarDays, PartyPopper } from "lucide-react";

function ConfirmedEvents() {
  const announcements = useQuery(api.staff.publicAnnouncements);

  if (announcements === undefined) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading event announcements…</p>;
  }

  const events = announcements.filter((announcement) => announcement.category === "event");

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-7 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-50 text-[#987000]">
          <PartyPopper className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">No confirmed events announced</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          There are no official OpenWorlds events published right now. We’ll list an event here only after
          the team has confirmed its details.
        </p>
        <Link to="/news" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">
          See all official updates <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <article key={event._id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Official event</span>
            <time className="text-slate-400" dateTime={new Date(event.publishedAt).toISOString()}>
              Announced {new Date(event.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
            </time>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{event.title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{event.summary}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{event.body}</p>
          {event.media.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{event.media.map((asset, index) => asset.url && (
            <figure key={`${event._id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {asset.mediaType === "image" ? <img src={asset.url} alt={asset.altText || `${event.title} media ${index + 1}`} loading="lazy" className="max-h-[32rem] w-full object-contain" /> : <video src={asset.url} controls preload="metadata" className="max-h-[32rem] w-full bg-black" aria-label={asset.altText || `${event.title} video ${index + 1}`} />}
              {asset.altText && <figcaption className="px-3 py-2 text-xs text-slate-500">{asset.altText}</figcaption>}
            </figure>
          ))}</div>}
        </article>
      ))}
    </div>
  );
}

export default function Events() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <CalendarDays className="size-4" /> Events
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Official OpenWorlds events</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Confirmed events are published by the OpenWorlds team. Dates and details appear here only after
            they’ve been verified.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#events" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">View events</a>
            <Link to="/news" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Official news</Link>
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 flex items-center gap-3">
          <CalendarDays className="size-5 text-[#7651c9]" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Event announcements</h2>
            <p className="mt-1 text-sm text-slate-500">Published and confirmed by the team</p>
          </div>
        </div>
        <ConfirmedEvents />
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026.
      </footer>
    </main>
  );
}
