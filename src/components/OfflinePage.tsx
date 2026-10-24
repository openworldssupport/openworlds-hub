import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Loader2, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router";

export function OfflinePage({ children }: { children: ReactNode }) {
  const status = useQuery(api.siteStatus.publicStatus);
  const me = useQuery(api.staff.me);
  const location = useLocation();
  const isAdmin = Boolean(me?.isAdmin);

  if (status === undefined) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="size-6 animate-spin text-slate-500" aria-label="Checking site status" /></main>;
  }
  if (status === "available" || isAdmin || location.pathname === "/auth") return <>{children}</>;

  return (
    <main className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-auto bg-[#f7f8fa] px-5 py-12 text-slate-900">
      <section className="w-full max-w-xl text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
          <Wrench className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">OpenWorlds service notice</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          The site is under construction or currently unavailable.
        </h1>
        <p className="mt-7 text-sm text-slate-500">
          Administrator? <Link to="/auth?returnTo=%2Fadmin" className="font-medium text-slate-800 underline underline-offset-4 hover:text-slate-600">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
