import { SiteNav } from "@/components/SiteNav";
import { Megaphone } from "lucide-react";
import { Link } from "react-router";

export default function News() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto min-h-[65vh] max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-medium text-[#2870e8]">OpenWorlds</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">News</h1>
        <p className="mt-3 max-w-xl text-slate-600">Official game announcements and updates will be posted here.</p>
        <div className="mt-8 flex max-w-2xl items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2870e8]"><Megaphone className="size-5" /></span>
          <div><h2 className="font-medium">No news posted yet</h2><p className="mt-1 text-sm leading-6 text-slate-600">There are no official news posts available on this website yet.</p></div>
        </div>
        <div className="mt-8 flex gap-5 text-sm font-medium text-[#2870e8]">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/downloads" className="hover:underline">Downloads</Link>
        </div>
      </section>
    </main>
  );
}
