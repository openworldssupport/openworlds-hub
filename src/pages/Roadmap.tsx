import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, Flag, MessageSquareText } from "lucide-react";

const priorities = [
  { icon: MessageSquareText, title: "Share feedback", text: "Use the official support page to send feedback or report an issue." },
  { icon: Flag, title: "Follow published updates", text: "Confirmed announcements will be posted on the News page." },
  { icon: ArrowRight, title: "No dates promised", text: "We’ll add development milestones here once the team has verified them." },
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
            A public roadmap will appear here when development phases and milestones are confirmed by the team.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#phases" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Roadmap status</a>
            <Link to="/news" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Follow the updates</Link>
          </div>
        </div>
      </section>

      <section id="phases" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]"><Flag className="size-5" /></span>
            <div>
              <h2 className="text-lg font-semibold">No roadmap milestones published</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">There are no verified milestones or dates available to show. This page will list them once they’re confirmed; until then, we won’t mark unverified work as shipped or in progress.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How to follow progress</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {priorities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
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
            Send questions or feedback through the contact page. Public milestones will be added here after team review.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/community" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Join the community <ArrowRight className="size-4" /></Link>
            <Link to="/news" className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Read release notes</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · No unconfirmed milestones are listed.
      </footer>
    </main>
  );
}
