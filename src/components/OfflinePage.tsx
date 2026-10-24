import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Loader2, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router";

export function OfflinePage({ children }: { children: ReactNode }) {
  const status = useQuery(api.siteStatus.publicStatus);
  const me = useQuery(api.staff.me);
  const location = useLocation();
  const canManage = Boolean(me?.isStaff);

  if (status === undefined) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="size-6 animate-spin text-slate-500" aria-label="Checking site status" /></main>;
  }
  if (status === "available" || canManage || location.pathname === "/auth") return <>{children}</>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <span className="flex size-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800"><Wrench className="size-6" /></span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">OpenWorlds · Service notice</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">We’ll be back soon.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">The website is temporarily offline while we work on it or address a service issue. Please check back later. Thanks for your patience.</p>
        <p className="mt-6 text-sm text-slate-500">If you’re a team member, <Link to="/auth?returnTo=%2Fstaff" className="font-medium text-[#0066cc] underline underline-offset-4">sign in to the staff portal</Link>.</p>
      </section>
    </main>
  );
}
