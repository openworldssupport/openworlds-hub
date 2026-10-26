import { useQuery } from "convex/react";
import { Link } from "react-router";
import { ArrowRight, BadgeCheck, ExternalLink, LoaderCircle, ShieldCheck, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";

export default function Creators() {
  const access = useQuery(api.users.creatorSpaceAccess);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <BadgeCheck className="size-4" /> OpenWorlds Creator Space
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Creator</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
            A private space for verified OpenWorlds creators, staff, and administrators.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {access === undefined ? (
          <div role="status" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            <LoaderCircle className="size-5 animate-spin" /> Checking Creator Space access…
          </div>
        ) : !access.allowed ? (
          <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-7 text-center sm:p-9">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600"><ShieldCheck className="size-6" /></span>
            <h2 className="mt-4 text-xl font-semibold">Restricted to verified creators and team members</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in with an approved OpenWorlds account. Creator access is granted by the team; a regular player account does not receive access automatically.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild><Link to="/auth?returnTo=%2Fcreators">Sign in</Link></Button>
              <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><BadgeCheck className="size-6" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">{access.accessLevel === "creator" ? "Verified creator" : access.accessLevel === "admin" ? "Administrator access" : "Staff access"}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Welcome to Creator Space</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">This area is available to verified creators and approved OpenWorlds staff and administrators.</p>
                </div>
              </div>
              {access.creatorProfile ? (
                <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold">Your verified creator profile</h3>
                  <p className="mt-3 text-lg font-medium">{access.creatorProfile.displayName}</p>
                  <p className="text-sm text-slate-600">@{access.creatorProfile.username}</p>
                  {access.creatorProfile.socialUrl && (
                    <a href={access.creatorProfile.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#176b45] hover:underline">
                      {access.creatorProfile.socialPlatform || "Social profile"}<ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold">Creator access and approvals</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Creator approval tools remain restricted to authorized team members and require the existing verification step.</p>
                  <Button asChild variant="outline" className="mt-4"><Link to="/community">Open creator approvals <ArrowRight className="size-4" /></Link></Button>
                </div>
              )}
            </section>

            <aside className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-[#176b45]"><Users className="size-5" /></div>
              <h2 className="mt-4 font-semibold">OpenWorlds community</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Find public creator listings, community links, and creator application information on the public community and media pages.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline"><Link to="/community">Community</Link></Button>
                <Button asChild variant="outline"><Link to="/media">Media</Link></Button>
              </div>
            </aside>
          </div>
        )}
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Private Creator Space</footer>
    </main>
  );
}
