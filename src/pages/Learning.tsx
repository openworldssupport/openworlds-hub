import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ArrowRight, GraduationCap, MessageSquareText } from "lucide-react";

export default function Learning() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <header className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-100"><GraduationCap className="size-4" /> Learning</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Learning resources</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Guides and lessons will be listed here when they are written and ready to use.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]"><GraduationCap className="size-5" /></span>
          <h2 className="mt-4 text-xl font-semibold">No lessons published yet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">There are no finished learning guides to browse right now. We’ll publish lesson links here when real materials are available.</p>
          <Link to="/news" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">Check official updates <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">Have a suggestion for a guide or topic?</p>
          <Link to="/support" className="inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline"><MessageSquareText className="size-4" /> Send feedback</Link>
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026.</footer>
    </main>
  );
}
