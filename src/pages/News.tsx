import { SiteNav } from "@/components/SiteNav";
import { Megaphone } from "lucide-react";
import { Link } from "react-router";

export default function News() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">News</h1>
          <p className="mt-3 max-w-xl text-blue-50">Official game announcements and updates will be posted here.</p>
        </div>
      </section>
      <section className="mx-auto min-h-[45vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex max-w-2xl items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]"><Megaphone className="size-5" /></span>
          <div><h2 className="font-medium">No news posted yet</h2><p className="mt-1 text-sm leading-6 text-slate-600">There are no official news posts available on this website yet.</p></div>
        </div>
        <div className="mt-8 flex gap-5 text-sm font-medium text-[#7651c9]">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/downloads" className="hover:underline">Downloads</Link>
        </div>
      </section>
    </main>
  );
}
