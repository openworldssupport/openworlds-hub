import { SiteNav } from "@/components/SiteNav";
import { careerBranches } from "@/lib/careers";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, HeartHandshake } from "lucide-react";
import { Link } from "react-router";

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Build with us.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Explore contributor opportunities across engineering, design, community, marketing, and strategy. Business Strategy Associate is filled; the other listed roles are accepting applications.</p>
          <a href="#roles" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Explore opportunities <ArrowRight className="size-4" /></a>
        </div>
      </section>
      <section id="roles" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><BriefcaseBusiness className="size-5 text-[#0066cc]" /><p className="mt-3 text-2xl font-semibold">{careerBranches.reduce((count, branch) => count + branch.roles.length, 0)}</p><p className="text-sm text-slate-500">listed opportunities</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><CheckCircle2 className="size-5 text-emerald-600" /><p className="mt-3 text-2xl font-semibold">{careerBranches.reduce((count, branch) => count + branch.roles.filter((item) => item.status !== "Filled").length, 0)}</p><p className="text-sm text-slate-500">accepting applications</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><HeartHandshake className="size-5 text-[#7651c9]" /><p className="mt-3 text-sm font-semibold">Volunteer contributor roles</p><p className="text-sm text-slate-500">All listed roles are unpaid</p></div>
        </div>
        <div className="space-y-8">
          {careerBranches.map((branch) => (
            <section key={branch.slug} aria-labelledby={`branch-${branch.slug}`}>
              <div className="mb-4 border-b border-slate-200 pb-3"><h2 id={`branch-${branch.slug}`} className="text-xl font-semibold tracking-tight">{branch.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{branch.summary}</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                {branch.roles.map((role) => (
                  <article key={role.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-[#7651c9]">{role.department}</p><h3 className="mt-1 text-lg font-semibold">{role.title}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${role.status === "Filled" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}>{role.status === "Filled" ? "Filled" : "Open"}</span></div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{role.summary}</p>
                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><h4 className="font-semibold">You’ll contribute</h4><ul className="mt-2 space-y-1.5 text-slate-600">{role.responsibilities.map((item) => <li key={item} className="flex gap-2"><span className="text-[#0066cc]">·</span>{item}</li>)}</ul></div><div><h4 className="font-semibold">Good fit if you</h4><ul className="mt-2 space-y-1.5 text-slate-600">{role.qualifications.map((item) => <li key={item} className="flex gap-2"><span className="text-[#7651c9]">·</span>{item}</li>)}</ul></div></div>
                    <div className="mt-5 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="size-3.5" /> Flexible, remote contribution</span>{role.status === "Filled" ? <span className="text-sm font-medium text-slate-500">Not accepting applications</span> : <Link to={`/careers/role/${role.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066cc] hover:underline">Role details &amp; apply <ArrowRight className="size-4" /></Link>}</div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <aside className="mt-9 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><HeartHandshake className="mt-0.5 size-5 shrink-0" /><p><strong>Volunteer roles:</strong> These contributor roles are voluntary and unpaid. Please apply only if that arrangement works for you. Questions? <a href="mailto:careers@openworlds.dk" className="font-semibold underline">careers@openworlds.dk</a></p></aside>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026</footer>
    </main>
  );
}
