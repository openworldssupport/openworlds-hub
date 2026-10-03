import { SiteNav } from "@/components/SiteNav";
import { ArrowRight, Code2, Gamepad2, Users } from "lucide-react";

const topics = [
  { title: "Code foundations", description: "An introduction to web and software development concepts for beginners.", icon: Code2 },
  { title: "UGC design", description: "Explore ideas in gameplay loops, creator tools, and player-friendly systems.", icon: Gamepad2 },
  { title: "Community growth", description: "Learn about onboarding, engagement, and building creative communities.", icon: Users },
];

export default function Learning() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="bg-[#0066cc] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds Learning Center</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Learn to build, create, and ship</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">A guide to topics around technology, user-generated content, and online communities.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {topics.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-slate-200 p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]"><Icon className="size-5" /></span>
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-slate-500">Information coming soon <ArrowRight className="size-4" /></span>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">This center is informational only for now. Lessons, activities, and progress tracking are not available on this website.</p>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
