import { SiteNav } from "@/components/SiteNav";
import { careerRoles } from "@/lib/careers";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Build with us.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">Explore contributor roles and apply online. Applications are sent to our careers team.</p>
          <a href="#roles" className="mt-7 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Browse roles</a>
        </div>
      </section>
      <section id="roles" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold">All roles are voluntary and unpaid</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Choose a role below to read about it and complete an application. Questions? Email <a href="mailto:careers@openworlds.dk" className="font-medium text-[#0066cc] hover:underline">careers@openworlds.dk</a>.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {careerRoles.map((role) => (
            <article key={role.slug} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-medium">{role.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{role.department} · {role.status}</p>
              </div>
              <Link to={`/careers/role/${role.slug}`} aria-label={`View ${role.title}`} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">View <ArrowRight className="size-4" /></Link>
            </article>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · All roles are voluntary and unpaid.</footer>
    </main>
  );
}
