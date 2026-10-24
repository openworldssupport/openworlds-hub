import { SiteNav } from "@/components/SiteNav";
import { careerBranches, type CareerRole } from "@/lib/careers";
import { ArrowRight, HeartHandshake, Mail } from "lucide-react";
import { Link } from "react-router";

function PositionRow({ role }: { role: CareerRole }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{role.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{role.summary}</p>
      </div>
      <Link
        to={`/careers/role/${role.slug}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-700 hover:underline"
        aria-label={`View position: ${role.title}`}
      >
        View role <ArrowRight className="size-4" />
      </Link>
    </li>
  );
}

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="border-b border-slate-200 bg-[#f5f4ee] px-5 py-12 text-slate-900 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#53665c]">OpenWorlds · Careers</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Help build a world people can make their own.</h1>
            <p className="mt-5 max-w-2xl leading-7 text-slate-600">We’re a small project team working on a social world-building game. See the roles we’re looking for and contact the team directly about an opening.</p>
          </div>
          <a href="#positions" className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">Current openings <ArrowRight className="size-4" /></a>
        </div>
      </section>
      <div className="border-b border-slate-200 bg-white px-5 py-3 text-center text-sm text-slate-600">
        All listed contributor roles are voluntary and unpaid. To enquire, email <a className="font-semibold text-[#173c33] underline" href="mailto:careers@openworlds.dk">careers@openworlds.dk</a>.
      </div>

      <section id="positions" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#53665c]">The team</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Current positions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Each position explains its focus and department. For any role, send your enquiry straight to our careers inbox.</p>
          </div>
          <a href="mailto:careers@openworlds.dk" className="inline-flex items-center gap-2 text-sm font-semibold text-[#173c33] hover:underline"><Mail className="size-4" /> Contact Careers</a>
        </div>

        <div className="space-y-5">
          {careerBranches.map((branch) => (
            <section
              key={branch.slug}
              aria-labelledby={`department-${branch.slug}`}
              className="overflow-hidden border-y border-slate-200 bg-white"
            >
              <header className="border-b border-slate-200 bg-[#f8f8f5] px-5 py-4">
                <h3 id={`department-${branch.slug}`} className="font-semibold">
                  {branch.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{branch.summary}</p>
              </header>
              <ul className="divide-y divide-slate-100">
                {branch.roles.map((role) => (
                  <PositionRow key={role.slug} role={role} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 bg-[#f8f8f5] p-5">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-slate-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Volunteer positions</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Positions are remote and unpaid, with flexible hours.
              </p>
            </div>
          </div>
          <a href="mailto:careers@openworlds.dk" className="inline-flex items-center gap-2 text-sm font-semibold text-[#173c33] underline"><Mail className="size-4" /> Email Careers</a>
        </aside>

      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All contributor roles are voluntary and unpaid.
      </footer>
    </main>
  );
}
