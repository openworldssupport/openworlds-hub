import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, Compass, Layers, Palette, Upload } from "lucide-react";

type World = {
  name: string;
  creator: string;
  category: string;
  categoryClass: string;
  blurb: string;
  tags: string[];
  swatch: string;
};

const worlds: World[] = [
  {
    name: "Harbourlight",
    creator: "mira.builds",
    category: "Adventure",
    categoryClass: "bg-blue-50 text-[#0066cc] border-blue-100",
    blurb: "A working port town with tide-based shortcuts and a lighthouse you can actually climb.",
    tags: ["Traversal", "NPCs"],
    swatch: "from-[#0066cc] to-[#1764bc]",
  },
  {
    name: "Velvet Circuit",
    creator: "nyx",
    category: "Puzzle",
    categoryClass: "bg-violet-50 text-[#7651c9] border-violet-100",
    blurb: "Redirect light through a neon factory. Ten rooms, one very patient community solution thread.",
    tags: ["Logic", "Co-op"],
    swatch: "from-[#7651c9] to-[#55409b]",
  },
  {
    name: "Sunken Gardens",
    creator: "otter.mp",
    category: "Sandbox",
    categoryClass: "bg-[#f3c64e]/25 text-[#7c5a00] border-[#f3c64e]/50",
    blurb: "A calm builder's escape with terraced pools, night lighting, and shared plot ownership.",
    tags: ["Building", "Chill"],
    swatch: "from-[#f3c64e] to-[#e0a91f]",
  },
  {
    name: "Relay Station 9",
    creator: "cobalt",
    category: "Competitive",
    categoryClass: "bg-blue-50 text-[#0066cc] border-blue-100",
    blurb: "Fast round-based mode built for tournaments: three lanes, rotating objectives, no downtime.",
    tags: ["PvP", "Ranked-ready"],
    swatch: "from-[#0066cc] to-[#7651c9]",
  },
  {
    name: "The Long Quiet",
    creator: "sable",
    category: "Story",
    categoryClass: "bg-violet-50 text-[#7651c9] border-violet-100",
    blurb: "A slow narrative walk through a town that remembers everyone who visited it before you.",
    tags: ["Narrative", "Atmospheric"],
    swatch: "from-[#55409b] to-[#7651c9]",
  },
  {
    name: "Foundry Playground",
    creator: "gears.dev",
    category: "Sandbox",
    categoryClass: "bg-[#f3c64e]/25 text-[#7c5a00] border-[#f3c64e]/50",
    blurb: "Conveyor belts, gears, and a redstone-style circuit board people keep finding exploits for.",
    tags: ["Automation", "Experimental"],
    swatch: "from-[#f3c64e] to-[#0066cc]",
  },
];

const categories = [
  { label: "Adventure", tone: "bg-blue-50 text-[#0066cc]" },
  { label: "Puzzle", tone: "bg-violet-50 text-[#7651c9]" },
  { label: "Sandbox", tone: "bg-amber-50 text-[#987000]" },
  { label: "Competitive", tone: "bg-blue-50 text-[#0066cc]" },
  { label: "Story", tone: "bg-violet-50 text-[#7651c9]" },
];

export default function Worlds() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">Worlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Made by the community</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            A rotating shelf of worlds worth opening. Everything here was built by a player and shared with the
            rest of us.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#shelf" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Browse worlds</a>
            <Link to="/learning" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Learn to build</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-500">Browse by type:</span>
          {categories.map((category) => (
            <span key={category.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${category.tone}`}>
              {category.label}
            </span>
          ))}
        </div>
      </section>

      <section id="shelf" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3">
          <Compass className="size-5 text-[#7651c9]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured this month</h2>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <article key={world.name} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className={`h-24 bg-gradient-to-br ${world.swatch}`} aria-hidden="true" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${world.categoryClass}`}>
                    {world.category}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{world.name}</h3>
                <p className="mt-1 text-xs text-slate-500">by {world.creator}</p>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{world.blurb}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {world.tags.map((tag) => (
                    <li key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <Palette className="size-6 text-[#0066cc]" />
            <h3 className="mt-4 font-semibold">Built by players</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Every featured world was made inside the creator tools. No studio shortcuts.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <Layers className="size-6 text-[#7651c9]" />
            <h3 className="mt-4 font-semibold">Curated, not algorithmic</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">A human picks the shelf each month so good work does not get buried.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <Upload className="size-6 text-[#987000]" />
            <h3 className="mt-4 font-semibold">Open submissions</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Finished a world? Send it in and it goes into the next review round.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-5 rounded-xl border border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Built something you are proud of?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Submit it for the community shelf, or share it in Discord and let players find it themselves.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/support" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Submit a world <ArrowRight className="size-4" /></Link>
            <Link to="/events" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">See contests</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Featured worlds are chosen by the community team.
      </footer>
    </main>
  );
}
