import { SiteNav } from "@/components/SiteNav";
import { careerBranches } from "@/lib/careers";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router";

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">Open Worlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Join Open Worlds</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Help build OpenWorlds through a voluntary, unpaid contributor role. Browse departments and apply for a position that fits your skills.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#browse" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Browse positions</a>
            <a href="#how-to-apply" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Contact the team</a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        <aside className="h-fit rounded-xl border border-slate-200 border-t-2 border-t-[#f3c64e] p-4 lg:sticky lg:top-24">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness className="size-4 text-[#7651c9]" /> Departments</h2>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Career departments">
            {careerBranches.map((branch) => <a key={branch.slug} href={`#${branch.slug}`} className="whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">{branch.title.replace(/&/g, "and").replace(/\//g, " · ")}</a>)}
          </nav>
        </aside>

        <div>
          <div className="mb-8 rounded-xl border border-violet-100 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-5 sm:p-6">
            <h2 className="font-semibold">All roles are voluntary and unpaid</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Submitted applications are stored securely for the OpenWorlds team to review. Choose a department to browse its roles.</p>
          </div>

          <div id="browse" className="space-y-10 scroll-mt-24">
            {careerBranches.map((branch) => (
              <section key={branch.slug} id={branch.slug} className="scroll-mt-24">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-xl font-semibold tracking-tight">{branch.title.replace(/&/g, "and").replace(/\//g, " · ")}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{branch.summary}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {branch.roles.map((role) => (
                    <article key={role.slug} className="flex min-w-0 flex-col items-start gap-4 rounded-xl border border-slate-200 p-4 sm:p-5">
                      <div>
                        <h3 className="font-medium">{role.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1">{role.department.replace(/&/g, "and")}</span>
                          <span className="rounded-md bg-blue-50 px-2.5 py-1 font-medium text-[#0052a3]">{role.status}</span>
                          <span className="rounded-md bg-violet-50 px-2.5 py-1 font-medium text-[#7651c9]">Voluntary · unpaid</span>
                        </div>
                      </div>
                      <Link to={`/careers/role/${role.slug}`} className="inline-flex h-10 max-w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">View position <ArrowRight className="size-4" /></Link>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <section id="how-to-apply" className="scroll-mt-24 rounded-xl border border-violet-100 border-t-2 border-t-[#f3c64e] bg-gradient-to-r from-violet-50 to-amber-50 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Applications</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Open a position and complete its application form. Your application is submitted to the team for review.</p>
            </section>
          </div>
        </div>
      </div>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · All positions are voluntary and unpaid.</footer>
    </main>
  );
}
