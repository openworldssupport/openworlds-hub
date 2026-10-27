import { useQuery } from "convex/react";
import { Navigate } from "react-router";
import { BadgeCheck, ExternalLink, LoaderCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";

export default function Creators() {
  const access = useQuery(api.users.creatorSpaceAccess);

  if (access === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div role="status" className="flex items-center gap-3">
          <LoaderCircle className="size-5 animate-spin" /> Checking Creator Space access…
        </div>
      </main>
    );
  }

  if (!access.allowed) return <Navigate to="/" replace />;

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
            A private space for verified creators and authorized OpenWorlds team members.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <BadgeCheck className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
                {access.accessLevel === "creator" ? "Verified creator" : "Authorized team access"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Welcome to Creator Space</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {access.accessLevel === "creator"
                  ? "Your OpenWorlds creator account is verified."
                  : "Your verified OpenWorlds account has access to Creator Space."}
              </p>
            </div>
          </div>
          {access.creatorProfile && (
            <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold">Your verified creator profile</h3>
              <p className="mt-3 text-lg font-medium">{access.creatorProfile.displayName}</p>
              <p className="text-sm text-slate-600">@{access.creatorProfile.username}</p>
              {access.creatorProfile.socialUrl && (
                <a
                  href={access.creatorProfile.socialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#176b45] hover:underline"
                >
                  {access.creatorProfile.socialPlatform || "Social profile"}
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          )}
        </section>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Private Creator Space
      </footer>
    </main>
  );
}
