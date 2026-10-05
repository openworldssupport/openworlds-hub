import { SiteNav } from "@/components/SiteNav";
import { careerRoles } from "@/lib/careers";

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Build with us.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Business Strategy Associate is filled. Other openings will be listed here when their titles and availability are confirmed.</p>
          <a href="#roles" className="mt-7 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">View role status</a>
        </div>
      </section>
      <section id="roles" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-4">
          {careerRoles.map((role) => (
            <article key={role.slug} className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#7651c9]">{role.department}</p>
                  <h2 className="mt-1 text-lg font-semibold">{role.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">This position has been filled and is not accepting applications.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Filled</span>
              </div>
            </article>
          ))}
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            No other role details are currently listed. For questions, contact <a href="mailto:careers@openworlds.dk" className="font-medium text-[#0066cc] hover:underline">careers@openworlds.dk</a>.
          </p>
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026</footer>
    </main>
  );
}
