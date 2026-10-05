import { ArrowRight, Gamepad2, Mail } from "lucide-react";
import { Link } from "react-router";
import { SiteNav } from "@/components/SiteNav";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="flex items-center gap-2 text-sm font-medium text-[#0066cc]"><Gamepad2 className="size-4" /> OpenWorlds</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">A world built together.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Create, share, and explore. Follow the project, meet the community, or help us build what comes next.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/community" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Visit the community <ArrowRight className="size-4" /></Link>
            <Link to="/careers" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Explore careers</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-5 py-12 sm:grid-cols-2 sm:px-8 sm:py-16">
        <article className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Help build OpenWorlds</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Browse our open contributor roles and send an application directly to the team.</p>
          <Link to="/careers" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">See open roles <ArrowRight className="size-4" /></Link>
        </article>
        <article className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Need help?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Find answers or send a message to OpenWorlds support.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium text-[#0066cc]">
            <Link to="/support" className="hover:underline">Visit support</Link>
            <a href="mailto:support@openworlds.dk" className="inline-flex items-center gap-1 hover:underline"><Mail className="size-4" /> Email us</a>
          </div>
        </article>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/terms" className="hover:underline">Terms</Link></footer>
    </main>
  );
}
