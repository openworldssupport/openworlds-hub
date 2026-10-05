import { SiteNav } from "@/components/SiteNav";

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Build with us.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">There are no confirmed openings listed here right now.</p>
          <a href="#roles" className="mt-7 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Role information</a>
        </div>
      </section>
      <section id="roles" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="font-semibold">No confirmed openings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">There are no roles to apply for through this page right now. For general questions, contact <a href="mailto:careers@openworlds.dk" className="font-medium text-[#0066cc] hover:underline">careers@openworlds.dk</a>.</p>
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026</footer>
    </main>
  );
}
