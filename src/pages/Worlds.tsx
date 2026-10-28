import { useDeferredValue, useState } from "react";
import { useQuery } from "convex/react";
import { Link, useNavigate } from "react-router";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { Input } from "@/components/ui/input";
import { ArrowRight, BadgeCheck, Compass, Search, ShieldCheck, Users } from "lucide-react";

export default function Worlds() {
  const [search, setSearch] = useState("");
  const [worldSearch, setWorldSearch] = useState("");
  const navigate = useNavigate();
  const deferredSearch = useDeferredValue(search.trim().replace(/^@/, ""));
  const deferredWorldSearch = useDeferredValue(worldSearch.trim());
  const profiles = useQuery(api.users.searchPlayerProfiles, { search: deferredSearch });
  const worlds = useQuery(api.gameData.searchPublishedWorlds, { search: deferredWorldSearch });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds discovery</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Find players and worlds</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Search player profiles that have opted into discovery. Published community worlds will appear here when real listings are available.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]"><Users className="size-5" /></span>
            <div><h2 className="text-xl font-semibold tracking-tight">Player profiles</h2><p className="mt-1 text-sm leading-6 text-slate-600">Search by username or display name. Only profiles made discoverable by their owner are shown.</p></div>
          </div>
          <label htmlFor="profile-search" className="sr-only">Search player usernames or names</label>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input id="profile-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search usernames or names…" className="h-11 pl-10" autoComplete="off" />
          </div>
          <div className="mt-5" aria-live="polite">
            {deferredSearch.length < 2 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Enter at least 2 characters to search.</p>
            ) : profiles === undefined ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Searching player profiles…</p>
            ) : profiles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No discoverable players found. Check the spelling or try another username.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {profiles.map((profile) => (
                  <li key={profile.username} className="flex items-center gap-3 px-4 py-3">
                    {profile.image ? <img src={profile.image} alt="" loading="lazy" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" /> : <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#0066cc]">{profile.username.slice(0, 1).toUpperCase()}</span>}
                    <button type="button" onClick={() => navigate(`/players/${encodeURIComponent(profile.username)}`)} className="min-w-0 flex-1 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45]">
                      <p className="flex flex-wrap items-center gap-1.5 truncate font-medium text-slate-900">{profile.username}{profile.exact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Exact match</span>}{profile.isOfficialCreator && <BadgeCheck className="size-4 shrink-0 text-sky-600" aria-label="Official Content Creator" />}{profile.isCompanyStaff && profile.publicBadge && <RoleBadge badge={profile.publicBadge} />}</p>
                      {profile.displayName && profile.displayName !== profile.username && <p className="truncate text-sm text-slate-500">{profile.displayName}</p>}
                      <span className="mt-1 inline-block text-xs font-medium text-[#176b45]">View profile</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]"><Compass className="size-5" /></span>
            <div><h2 className="text-xl font-semibold tracking-tight">Worlds</h2><p className="mt-1 text-sm leading-6 text-slate-600">Search real worlds that have been published to OpenWorlds.</p></div>
          </div>
          <label htmlFor="world-search" className="sr-only">Search published worlds</label>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input id="world-search" value={worldSearch} onChange={(event) => setWorldSearch(event.target.value)} placeholder="Search worlds…" className="h-11 pl-10" autoComplete="off" />
          </div>
          <div className="mt-5" aria-live="polite">
            {deferredWorldSearch.length < 2 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Enter at least 2 characters to search published worlds.</p>
            ) : worlds === undefined ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Searching published worlds…</p>
            ) : worlds.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No published worlds found. Worlds will appear once the game’s publishing feed is connected.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {worlds.map((world) => (
                  <li key={world.id}>
                    <Link to={`/worlds/${world.id}`} className="flex min-h-28 gap-4 px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#176b45]">
                      {world.image ? <img src={world.image} alt="" loading="lazy" className="w-28 shrink-0 border border-slate-200 object-cover" /> : <span aria-hidden="true" className="flex w-28 shrink-0 items-center justify-center bg-[#e8f3ec] text-[#176b45]"><Compass className="size-7" /></span>}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium text-slate-900">{world.title}</span>
                        {world.description && <span className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{world.description}</span>}
                        <span className="mt-auto flex items-center justify-between gap-3 pt-2">
                          {world.ownerUsername ? <span className="text-xs text-slate-500">By {world.ownerUsername}</span> : <span />}
                          <span className="text-xs font-medium text-[#176b45]">View world details →</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#0066cc] ring-1 ring-slate-200"><ShieldCheck className="size-5" /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Privacy-respecting discovery</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">You choose what’s visible</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Player accounts appear only when they opt into discovery. Active company staff profiles are public and show their assigned Staff or Developer badge. Sign-in emails and private account details are never shown.</p>
          <Link to="/community" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100">Visit community <ArrowRight className="size-4" /></Link>
        </aside>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Find discoverable players and published worlds.</footer>
    </main>
  );
}
