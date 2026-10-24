import { SiteNav } from "@/components/SiteNav";
import { CareerEnquiryDialog } from "@/components/CareerEnquiryDialog";
import { careerBranches, type CareerRole } from "@/lib/careers";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function PositionRow({ role, isOpen }: { role: CareerRole; isOpen: boolean }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{role.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{role.summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <Link
          to={`/careers/role/${role.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066cc] hover:underline"
          aria-label={`View position: ${role.title}`}
        >
          View role <ArrowRight className="size-4" />
        </Link>
        {isOpen && (
          <Link
            to={`/careers/apply/${role.slug}`}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            aria-label={`Apply for ${role.title}`}
          >
            Apply
          </Link>
        )}
      </div>
    </li>
  );
}

export default function Careers() {
  const availability = useQuery(api.careerApplications.roleAvailability);
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Build the project with us.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50">We’re working on a social world-building game. Browse current openings, read what each role involves, and contact the Careers team directly from the site.</p>
          </div>
          <a href="#positions" className="inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Current openings <ArrowRight className="size-4" /></a>
        </div>
      </section>
      <section className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="text-sm leading-6 text-slate-600">All listed contributor roles are remote, voluntary, and unpaid. Applications and questions are emailed directly to careers@openworlds.dk and aren’t stored in the website.</p>
          <CareerEnquiryDialog label="Ask Careers a question" variant="outline" mode="question" />
        </div>
      </section>
      <section id="positions" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7651c9]">Open positions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Current positions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Select a role to read its details and submit a role-specific application by email.</p>
          </div>
          <CareerEnquiryDialog label="Ask Careers a question" variant="outline" mode="question" />
        </div>
        <div className="space-y-5">
          {careerBranches.map((branch) => (
            <section key={branch.slug} aria-labelledby={`department-${branch.slug}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h3 id={`department-${branch.slug}`} className="font-semibold">{branch.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{branch.summary}</p>
              </header>
              <ul className="divide-y divide-slate-100">{branch.roles.map((role) => {
                const isOpen = availability?.find((item) => item.slug === role.slug)?.isOpen === true;
                return <PositionRow key={role.slug} role={role} isOpen={isOpen} />;
              })}</ul>
            </section>
          ))}
        </div>
        <aside className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-5">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-[#0066cc]" />
            <div><h3 className="font-semibold">Volunteer positions</h3><p className="mt-1 text-sm leading-6 text-slate-600">These roles are remote and unpaid, with flexible hours.</p></div>
          </div>
          <CareerEnquiryDialog label="Ask Careers a question" variant="outline" mode="question" />
        </aside>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · All contributor roles are voluntary and unpaid.</footer>
    </main>
  );
}
