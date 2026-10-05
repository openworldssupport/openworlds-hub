import { SiteNav } from "@/components/SiteNav";
import { Heart, Lightbulb, LockKeyhole, ShieldCheck, Users, Youtube } from "lucide-react";

const guidelines = [
  { title: "Respect & kindness", description: "Treat all community members with respect. Harassment, discrimination, and hateful content have no place here.", icon: Heart },
  { title: "Privacy & security", description: "Protect your personal information and respect other people's privacy. Never share or request sensitive details.", icon: LockKeyhole },
  { title: "Original content", description: "Create original work and respect intellectual property. Do not repost content without permission.", icon: Lightbulb },
  { title: "Safety first", description: "Help keep community spaces safe. Report harmful content and follow community rules.", icon: ShieldCheck },
];

export default function Community() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">The OpenWorlds community</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Community links</h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-blue-50">Official external channels and general community guidelines.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">External channels</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">These links lead to third-party services. Their availability and content are managed outside this website.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]"><Users className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">Discord</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed Discord invite. Community activity and support availability are managed on Discord.</p>
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">Join Discord</a>
          </article>
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]"><Youtube className="size-5" /></div>
            <h3 className="mt-4 text-lg font-semibold">YouTube</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open the listed YouTube channel.</p>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-lg border border-violet-200 bg-violet-50/40 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Visit YouTube</a>
          </article>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Community guidelines</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center leading-7 text-slate-600">General guidance for interactions in OpenWorlds community spaces.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guidelines.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className="size-6 text-[#0066cc]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer className="px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
