import { SiteNav } from "@/components/SiteNav";
import { careerBranches, type CareerRole } from "@/lib/careers";
import { ArrowRight, HeartHandshake } from "lucide-react";
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

      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Join the team</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Browse positions by department. Roles are remote, flexible, and voluntary.
          </p>
          <a
            href="#positions"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50"
          >
            Browse positions <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <section id="positions" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#7651c9]">Careers</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Positions by department</h2>
          </div>
        </div>

        <div className="space-y-5">
          {careerBranches.map((branch) => (
            <section
              key={branch.slug}
              aria-labelledby={`department-${branch.slug}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-4">
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

        <aside className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-slate-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Volunteer positions</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Positions are remote and unpaid, with flexible hours.
              </p>
            </div>
          </div>
          <Link
            to="/support"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline"
          >
            Ask a question
          </Link>
        </aside>

      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All contributor roles are voluntary and unpaid.
      </footer>
    </main>
  );
}
