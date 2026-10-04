import { Globe2, Gamepad2, Mail } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section id="home" className="scroll-mt-20 border-b border-slate-100">
        <div className="mx-auto grid min-h-[500px] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-[#7651c9]"><Gamepad2 className="size-4" /> The Open Worlds community</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Create, share, explore.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Open Worlds is a place to make, share, and explore worlds with other people.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/community" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Join the community</Link>
            </div>
          </div>
          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0066cc] via-[#1764bc] to-[#7651c9] p-8 text-white md:min-h-[340px]">
            <div className="text-center">
              <Globe2 className="mx-auto size-24 text-amber-200 sm:size-32" strokeWidth={1.1} />
              <p className="mt-5 text-lg font-medium">Made by the community</p>
              <p className="mt-1 text-sm text-blue-100">Worlds shaped by creators</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-b border-slate-100 border-t-4 border-t-[#7651c9]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium text-[#7651c9]">About OpenWorlds</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">A place to make and share worlds</h2>
          <p className="mt-5 max-w-3xl leading-7 text-slate-600">OpenWorlds brings people together to create, share, and explore worlds.</p>
        </div>
      </section>

      <section id="support" className="scroll-mt-20 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
          <p className="text-sm font-medium text-[#7651c9]">Support</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Need a hand?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Browse the questions we hear most, or open a support ticket and our team will reply by email.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link to="/support" className="inline-flex h-11 items-center rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Open the support page</Link>
            <a href="mailto:support@openworlds.dk" className="inline-flex items-center gap-2 text-sm text-[#2870e8] hover:underline"><Mail className="size-4" /> support@openworlds.dk</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm text-slate-500 sm:px-8">
          <span>OpenWorlds © 2026. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Discord</a>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">YouTube</a>
            <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900">Terms</Link>
            <a href="#home" className="hover:text-slate-900">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
