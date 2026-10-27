import { SiteNav } from "@/components/SiteNav";
import { CareerEnquiryDialog } from "@/components/CareerEnquiryDialog";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { BadgeCheck, Heart, Lightbulb, LockKeyhole, Search, ShieldCheck, Users, Youtube, ExternalLink, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const guidelines = [
  { title: "Respect & kindness", description: "Treat all community members with respect. Harassment, discrimination, and hateful content have no place here.", icon: Heart },
  { title: "Privacy & security", description: "Protect your personal information and respect other people's privacy. Never share or request sensitive details.", icon: LockKeyhole },
  { title: "Original content", description: "Create original work and respect intellectual property. Do not repost content without permission.", icon: Lightbulb },
  { title: "Safety first", description: "Help keep community spaces safe. Report harmful content and follow community rules.", icon: ShieldCheck },
];

export default function Community() {
  const officialCreators = useQuery(api.users.publicOfficialCreators);
  const [creatorSearch, setCreatorSearch] = useState("");
  const creators = officialCreators ?? [];
  const creatorLoop = creators.length > 0 ? [...creators, ...creators] : creators;
  const normalizedCreatorSearch = creatorSearch.trim().replace(/^@/, "").toLowerCase();
  const matchingCreators = normalizedCreatorSearch
    ? creators
        .filter((creator) => `${creator.displayName} ${creator.username}`.toLowerCase().includes(normalizedCreatorSearch))
        .sort((a, b) => {
          const exactA = a.displayName.toLowerCase() === normalizedCreatorSearch || a.username.toLowerCase() === normalizedCreatorSearch;
          const exactB = b.displayName.toLowerCase() === normalizedCreatorSearch || b.username.toLowerCase() === normalizedCreatorSearch;
          const startsA = a.displayName.toLowerCase().startsWith(normalizedCreatorSearch) || a.username.toLowerCase().startsWith(normalizedCreatorSearch);
          const startsB = b.displayName.toLowerCase().startsWith(normalizedCreatorSearch) || b.username.toLowerCase().startsWith(normalizedCreatorSearch);
          return Number(!exactA) - Number(!exactB) || Number(!startsA) - Number(!startsB) || a.displayName.localeCompare(b.displayName);
        })
    : creators;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">The OpenWorlds community</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Community links</h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-blue-50">Official external channels and general community guidelines.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">External channels</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">These links lead to third-party services. Their availability and content are managed outside this website.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]"><Users className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">Discord</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed Discord invite. Community activity and support availability are managed on Discord.</p>
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">Join Discord</a>
          </article>
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]"><Youtube className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">YouTube</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed YouTube channel.</p>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg border border-violet-200 bg-violet-50/40 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Visit YouTube</a>
          </article>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Community guidelines</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">General guidance for interactions in OpenWorlds community spaces.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guidelines.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className="size-6 text-[#0066cc]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-medium text-[#7651c9]">Create with OpenWorlds</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">OpenWorlds Creator Program</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A home for creators making videos, streams, guides, art, and community stories around OpenWorlds. Approved creators are listed here with a verified badge; applying does not grant official status.</p>
            </div>
            <CareerEnquiryDialog label="Apply to the program" mode="creator-application" />
          </div>            <div className="mt-10 border-t border-slate-200 pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Meet the official creators</h3>
                <p className="mt-1 text-sm text-slate-600">Creators reviewed and approved by the OpenWorlds team.</p>
              </div>
              {creators.length > 0 && <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{creators.length} {creators.length === 1 ? "creator" : "creators"}</span>}
            </div>
            {creators.length > 0 && (
              <div className="relative mt-5 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input aria-label="Search official creators by name or username" value={creatorSearch} onChange={(event) => setCreatorSearch(event.target.value)} placeholder="Search creator names or usernames…" className="h-11 pl-10" autoComplete="off" />
              </div>
            )}
            {officialCreators === undefined ? (
              <p className="mt-5 text-sm text-slate-500">Loading official creators…</p>
            ) : creators.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-600">No Official Content Creators yet. Approved creators will appear here.</p>
            ) : normalizedCreatorSearch ? (
              matchingCreators.length === 0 ? (
                <p className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-600">No creators match that name. Try a shorter or more exact search.</p>
              ) : (
                <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {matchingCreators.map((creator) => {
                    const isExact = creator.displayName.toLowerCase() === normalizedCreatorSearch || creator.username.toLowerCase() === normalizedCreatorSearch;
                    return (
                      <li key={creator.username} className="flex items-center gap-3 px-4 py-3">
                        {creator.image ? <img src={creator.image} alt="" loading="lazy" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" /> : <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">{creator.username.slice(0, 1).toUpperCase()}</span>}
                        <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-semibold text-slate-900">{creator.displayName}{isExact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Exact match</span>}</span><span className="block truncate text-xs text-slate-500">@{creator.username}</span></span>
                        {creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" title={`Visit ${creator.displayName} on ${creator.socialPlatform || "their social profile"}`} className="shrink-0 text-slate-500 hover:text-[#176b45]"><ExternalLink className="size-4" aria-label="Open creator social profile" /></a>}
                        <span title="Verified Official Content Creator" className="shrink-0 text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <div className="creator-marquee mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 py-4" aria-label="Official Content Creators, scrolling automatically">
                <div className="creator-marquee-track flex w-max gap-4 px-4">
                  {creatorLoop.map((creator, index) => (
                    <div key={`${creator.username}-${index}`} aria-hidden={index >= creators.length} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      {creator.image ? (
                        <img src={creator.image} alt="" loading="lazy" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">{creator.username.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{creator.displayName}</span><span className="block truncate text-xs text-slate-500">@{creator.username}</span></span>
                      {creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" title={`Visit ${creator.displayName} on ${creator.socialPlatform || "their social profile"}`} className="shrink-0 text-slate-500 hover:text-[#176b45]"><ExternalLink className="size-4" aria-label="Open creator social profile" /></a>}
                      <span title="Verified Official Content Creator" className="shrink-0 text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {[
              { icon: Sparkles, title: "Make it yours", text: "Create videos, streams, artwork, tutorials, or other original OpenWorlds content." },
              { icon: BadgeCheck, title: "Get recognized", text: "Approved members receive the official creator badge and a public profile on this page." },
              { icon: Users, title: "Grow together", text: "Help new players discover the project and connect with the wider community." },
            ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5"><Icon className="size-5 text-[#176b45]" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#104b35] p-6 text-white sm:p-8">
            <div><h3 className="text-xl font-semibold">Interested in creating with us?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">Send the Careers team your OpenWorlds username, creator links, and a little about what you’d like to make.</p></div>
            <CareerEnquiryDialog label="Start an application" mode="creator-application" variant="outline" />
          </div>
        </div>
      </section>
      <footer className="px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
