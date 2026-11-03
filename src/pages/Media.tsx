import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { ArrowRight, BadgeCheck, Clapperboard, ExternalLink, Star, Youtube } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { CreatorApplicationForm } from "@/components/CreatorApplicationForm";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

const officialChannel = "https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA";
const officialUploadsPlaylist = "UUcEIUqR8lB_siqj1CE0XVjA";

export default function Media() {
  const officialCreators = useQuery(api.users.publicOfficialCreators);
  const creators = officialCreators ?? [];
  const [creatorApplicationOpen, setCreatorApplicationOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-blue-100"><Clapperboard className="size-4" /> OPENWORLDS MEDIA</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Stories from worlds worth exploring.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">Watch official OpenWorlds videos, discover community-made content as it’s featured, and apply to join our content creator program.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#official" className="inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#176b45] transition hover:bg-blue-50">Watch official videos <ArrowRight className="size-4" /></a>
              <a href="#creator-application" className="inline-flex h-11 items-center rounded-sm border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10">Apply as a creator</a>
            </div>
          </div>
          <div className="hidden size-40 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white md:flex"><Clapperboard className="size-16 stroke-[1.2]" /></div>
        </div>
      </section>

      <section id="official" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0066cc]">From the OpenWorlds team</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Official videos</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">The latest uploads from our official YouTube channel, in one place.</p>
          </div>
          <a href={officialChannel} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Visit YouTube <ExternalLink className="size-4" /></a>
        </div>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
          <div className="aspect-video">
            <iframe
              title="Official OpenWorlds YouTube videos"
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${officialUploadsPlaylist}`}
              className="size-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#176b45]">Community made</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Creator videos</h2>
            <p className="mt-3 leading-7 text-slate-600">We’ll feature videos from creators after they’ve been reviewed and selected. Creator channels aren’t automatically synced, and no one is listed here until there’s an approved feature.</p>
          </div>
          <div className="mt-7 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Star className="size-5" /></span>
              <div><h3 className="font-semibold">Make something about OpenWorlds?</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Apply to be considered for an official creator feature. Applications are reviewed by the team; meeting the guidelines doesn’t guarantee selection.</p></div>
            </div>
            <a href="#creator-application" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#176b45] px-4 text-sm font-medium text-white transition hover:bg-[#105337]">Creator requirements <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </section>

      <section id="creator-application" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold text-[#176b45]">Join the creator community</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Apply to be featured</h2>
          <p className="mt-4 leading-7 text-slate-600">We’re looking for creators who make thoughtful, original content about OpenWorlds and help keep the community welcoming.</p>
          <ul className="mt-6 space-y-4">
            {[
              "At least 200 subscribers or followers on one public video channel.",
              "A public channel with original videos; OpenWorlds-related content is a plus.",
              "Content and conduct that follow OpenWorlds community rules.",
              "A consistent, genuine interest in creating—not just a subscriber count.",
            ].map((requirement) =>            <li key={requirement} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#176b45]" />{requirement}</li>)}
          </ul>
          <p className="mt-6 text-xs leading-5 text-slate-500">Creator features are voluntary. Selection and any additional program terms are confirmed by the OpenWorlds team. Don’t share passwords or account security details.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
          {!creatorApplicationOpen ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8">
              <h3 className="text-lg font-semibold">Ready to apply?</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Start an application for the team to review. Applying does not automatically award the official creator badge.</p>
              <Button type="button" className="mt-5" onClick={() => setCreatorApplicationOpen(true)}><Youtube className="size-4" />Start creator application</Button>
            </div>
          ) : (
            <CreatorApplicationForm />
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Verified Openworlds Creators</h2>
          {officialCreators === undefined ? (
            <p className="mt-8 text-center text-sm text-slate-500">Loading official creators…</p>
          ) : creators.length > 0 ? (
            <div className="creator-marquee mt-8 overflow-hidden border border-slate-200 bg-white py-4" aria-label="Official creators, scrolling automatically">
              <div className="creator-marquee-track flex w-max gap-4 px-4">
                {[...creators, ...creators].map((creator, index) => (
                  <article key={`${creator.username}-${index}`} aria-hidden={index >= creators.length} className="flex min-w-64 items-center gap-3 border border-slate-200 bg-white px-4 py-3">
                    <Link to={`/players/${encodeURIComponent(creator.username)}`} tabIndex={index >= creators.length ? -1 : undefined} className="flex min-w-0 flex-1 items-center gap-3 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b45]">
                      {creator.image ? (
                        <img src={creator.image} alt="" loading="lazy" className="size-11 shrink-0 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#e8f3ec] text-sm font-semibold text-[#176b45]">{creator.username.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{creator.displayName}</span><span className="block truncate text-xs text-slate-500">@{creator.username}</span></span>
                    </Link>
                    {creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" tabIndex={index >= creators.length ? -1 : undefined} aria-label={`${creator.socialPlatform || "Social profile"} for ${creator.displayName}`} title={`${creator.socialPlatform || "Social profile"} profile`} className="shrink-0 text-slate-500 hover:text-[#176b45]"><ExternalLink className="size-4" /></a>}
                    <span title="Verified Official Content Creator" className="shrink-0 text-sky-600"><BadgeCheck className="size-5" aria-label="Verified Official Content Creator" /></span>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-8 rounded border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-sm text-slate-600">No verified creators are listed yet.</p>
          )}
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Media and creator features</footer>
    </main>
  );
}
