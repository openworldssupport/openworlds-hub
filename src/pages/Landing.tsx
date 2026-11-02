import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { SiteNav } from "@/components/SiteNav";
import { Wordmark } from "@/components/Wordmark";

const stagger = (index: number) => ({ "--i": index }) as CSSProperties;

const explore = [
  {
    to: "/worlds",
    title: "Worlds",
    text: "No published worlds are available yet; check for updates.",
  },
  {
    to: "/events",
    title: "Events",
    text: "No confirmed event announcements are available yet.",
  },
  {
    to: "/roadmap",
    title: "Roadmap",
    text: "No roadmap milestones have been published yet.",
  },
  {
    to: "/learning",
    title: "Learning",
    text: "No learning guides have been published yet.",
  },
  {
    to: "/news",
    title: "News",
    text: "Browse updates published by the team.",
  },
  {
    to: "/rules",
    title: "Rules",
    text: "General website and community guidelines.",
  },
  {
    to: "/careers",
    title: "Careers",
    text: "Browse current opportunities to contribute to OpenWorlds.",
  },
  {
    to: "/support",
    title: "Support",
    text: "Read support information or open a ticket.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <p className="text-sm font-medium text-blue-100">OpenWorlds</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              <span className="ow-line" style={stagger(0)}>
                <span>A community</span>
              </span>{" "}
              <span className="ow-line" style={stagger(1)}>
                <span>built together.</span>
              </span>
            </h1>
            <p className="ow-note mt-6 max-w-2xl border-l-2 border-white/40 pl-3 text-sm text-blue-50">
              Site news: OpenWorlds downloads are temporarily unavailable.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
              OpenWorlds is in development. Follow official project updates and find the current status of public resources.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/player-signup"
                className="ow-cta inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50"
              >
                Create a player account <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/community"
                className="ow-cta inline-flex h-11 items-center rounded-sm border border-white/50 px-5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Join the community
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-blue-100">
              <Link to="/downloads" className="font-medium text-white underline underline-offset-4 hover:text-amber-100">Download status</Link>
              <span aria-hidden="true" className="text-white/40">·</span>
              <Link to="/support" className="hover:text-white">Support</Link>
              <span aria-hidden="true" className="text-white/40">·</span>
              <Link to="/roadmap" className="hover:text-white">Roadmap</Link>
              <span aria-hidden="true" className="text-white/40">·</span>
              <Link to="/worlds" className="hover:text-white">Worlds</Link>
            </div>
          </div>
          <div className="ow-landing-mark" aria-hidden="true">
            <Wordmark variant="outline" className="text-white/25" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-300 pb-5">
          <h2 className="ow-heading-rule text-2xl font-semibold tracking-tight sm:text-3xl">Explore the site</h2>
          <Link to="/about" className="inline-flex items-center gap-2 pb-1 text-sm font-medium text-[#0066cc] hover:underline">
            About OpenWorlds <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 sm:gap-x-14">
          {explore.map(({ to, title, text }, index) => (
            <Link key={to} to={to} className="ow-index-row group" style={stagger(index)}>
              <span className="ow-index-num">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-1.5 text-base">
                  {title}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="ow-band mx-auto max-w-6xl">
          <p className="ow-band__eyebrow">In development</p>
          <h2>Downloads temporarily unavailable</h2>
          <p className="mt-3 text-sm leading-6">
            OpenWorlds downloads are temporarily unavailable. The game is still in development; published updates are listed on the News page.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/downloads" className="ow-band__cta">
              Check download status <ArrowRight className="size-4" />
            </Link>
            <Link to="/roadmap" className="ow-band__ghost">
              View the roadmap
            </Link>
          </div>
        </div>
      </section>

      <footer className="ow-footer border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-slate-500 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Wordmark className="size-5" label="" />
            <span>OpenWorlds © 2026. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap gap-5">
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
