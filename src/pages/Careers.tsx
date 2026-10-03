import { SiteNav } from "@/components/SiteNav";
import { careerBranches } from "@/lib/careers";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router";

function statusStyle(status: string) {
  if (status === "Open") return "bg-emerald-50 text-emerald-800";
  if (status === "Limited") return "bg-amber-50 text-amber-800";
  return "bg-violet-50 text-violet-800";
}

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="bg-[#0066cc] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">Open Worlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Join Open Worlds</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Help build a community-driven UGC platform where creators and players shape the future together. Browse branches and review each role before applying.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#browse" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Browse positions</a>
            <a href="#how-to-apply" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">How to apply</a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        <aside className="h-fit rounded-xl border border-slate-200 p-4 lg:sticky lg:top-24">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness className="size-4 text-[#0066cc]" /> Branches</h2>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Career branches">
            {careerBranches.map((branch) => <a key={branch.slug} href={`#${branch.slug}`} className="whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">{branch.title}</a>)}
          </nav>
        </aside>

        <div>
          <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <h2 className="font-semibold">What we’re building</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">OpenWorlds is a platform in active development where creators and communities collaborate to build user-generated worlds. The roles listed here are voluntary contributor roles. Review the details for each position before applying.</p>
          </div>

          <div id="browse" className="space-y-10 scroll-mt-24">
            {careerBranches.map((branch) => (
              <section key={branch.slug} id={branch.slug} className="scroll-mt-24">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-xl font-semibold tracking-tight">{branch.title} Branch</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{branch.summary}</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {branch.roles.map((role) => (
                    <article key={role.slug} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div>
                        <h3 className="font-medium">{role.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1">Department: {role.department}</span>
                          <span className={`rounded-md px-2.5 py-1 font-medium ${statusStyle(role.status)}`}>{role.status}</span>
                        </div>
                      </div>
                      <Link to={`/careers/role/${role.slug}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">View position <ArrowRight className="size-4" /></Link>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <section id="how-to-apply" className="scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">How to apply</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose a branch, open a position, and use the Apply Here link on its details page to reach the position-specific application page. Applications are reviewed manually. Online submission is not available until the application service is connected.</p>
            </section>
          </div>
        </div>
      </div>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
