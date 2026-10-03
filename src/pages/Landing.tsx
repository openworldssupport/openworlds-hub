import { ArrowRight, ArrowDown, Globe2, Gamepad2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section id="home" className="scroll-mt-20 border-b border-slate-100">
        <div className="mx-auto grid min-h-[500px] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2870e8]"><Gamepad2 className="size-4" /> The Open Worlds UGC platform</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Create, share, explore.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Open Worlds is a user-generated content platform where creators and communities build worlds together.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#2870e8] px-5 text-sm font-medium text-white hover:bg-[#1f5fc9]">Log in <ArrowRight className="size-4" /></Link>
              <a href="#news" className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">See updates <ArrowDown className="size-4" /></a>
            </div>
            <p className="mt-4 text-sm text-slate-500">No separate website account is needed.</p>
          </div>
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-[#2870e8] p-8 text-white md:min-h-[340px]">
            <div className="text-center">
              <Globe2 className="mx-auto size-24 sm:size-32" strokeWidth={1.1} />
              <p className="mt-5 text-lg font-medium">Made by the community</p>
              <p className="mt-1 text-sm text-blue-100">Worlds shaped by creators</p>
            </div>
          </div>
        </div>
      </section>

      <section id="news" className="scroll-mt-20 border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-medium text-[#2870e8]">Updates</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Game news</h2></div>
            <Link to="/auth" className="text-sm font-medium text-[#2870e8] hover:underline">Log in to your player home <ArrowRight className="ml-1 inline size-4" /></Link>
          </div>
          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6">
            <p className="font-medium">No news posted yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">OpenWorlds announcements will appear here once an official news feed is available.</p>
          </div>
        </div>
      </section>

      <section id="downloads" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium text-[#2870e8]">Play OpenWorlds</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Downloads</h2>
          <div className="mt-7 flex flex-col justify-between gap-5 rounded-xl border border-slate-200 p-6 sm:flex-row sm:items-center">
            <div><p className="font-medium">Official downloads</p><p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Download links and supported platforms haven’t been published here yet. We’ll only list confirmed versions.</p></div>
            <span className="w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">Not available yet</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm text-slate-500 sm:px-8">
          <span>OpenWorlds © 2026. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/careers" className="hover:text-slate-900">Careers</Link>
            <Link to="/community" className="hover:text-slate-900">Community</Link>
            <a href="#home" className="hover:text-slate-900">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
