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
    <main className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-auto bg-[#f7f8fa] px-5 py-12 text-slate-900" aria-live="polite">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100">
          <Wrench className="size-5 text-slate-600" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">OpenWorlds status</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          The website is temporarily unavailable
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
          We’re carrying out maintenance or responding to an issue. Please check back shortly. This page will update when the site is available again.
        </p>
        <p className="mt-6 text-sm text-slate-600">
          Need help? Email <a href="mailto:contact@openworlds.dk" className="font-medium text-[#176b45] underline underline-offset-4">contact@openworlds.dk</a>.
        </p>
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Staff can <Link to="/auth?returnTo=%2Fstaff" className="font-medium text-slate-800 underline underline-offset-4 hover:text-slate-600">sign in here</Link> to manage the site.
        </p>
      </section>
    </main>
  );
}
