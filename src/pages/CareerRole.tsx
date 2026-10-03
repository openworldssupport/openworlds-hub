import { SiteNav } from "@/components/SiteNav";
import { careerRoles } from "@/lib/careers";
import { ArrowLeft, ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Link, useParams } from "react-router";

export function CareerRole() {
  const { roleSlug } = useParams();
  const role = careerRoles.find((item) => item.slug === roleSlug);

  if (!role) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <SiteNav />
        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h1 className="text-3xl font-semibold">Position not found</h1>
          <p className="mt-3 text-slate-600">That role may have moved or is not listed.</p>
          <Link to="/careers" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc]"><ArrowLeft className="size-4" /> Back to careers</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link to="/careers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="size-4" /> All positions</Link>
        <div className="mt-8 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]"><BriefcaseBusiness className="size-6" /></div>
        <p className="mt-5 text-sm font-medium text-[#0066cc]">{role.branch.title} Branch</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{role.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-md bg-slate-100 px-3 py-1.5">Department: {role.department}</span>
          <span className="rounded-md bg-slate-100 px-3 py-1.5">{role.status}</span>
          <span className="rounded-md bg-slate-100 px-3 py-1.5">Voluntary contributor role</span>
        </div>
        <div className="mt-8 space-y-6 border-t border-slate-200 pt-6">
          <div><h2 className="font-semibold">About this branch</h2><p className="mt-2 text-sm leading-6 text-slate-600">{role.branch.summary}</p></div>
          <div><h2 className="font-semibold">Role details</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is a voluntary contributor position. The OpenWorlds team will review applications manually. Specific responsibilities and selection details should be confirmed with the team before applying.</p></div>
        </div>
        <Link to={`/careers/apply/${role.slug}`} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Apply Here <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  );
}

export default CareerRole;

export function CareerApplicationGateway() {
  const { roleSlug } = useParams();
  const role = careerRoles.find((item) => item.slug === roleSlug);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#0066cc]"><BriefcaseBusiness className="size-6" /></div>
          {role ? (
            <>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Application submission unavailable</h1>
              <p className="mt-4 leading-7 text-slate-600">Applications for <strong>{role.title}</strong> belong to this position’s dedicated application flow. The secure application service is not connected yet, so no application has been submitted and no personal information is collected here.</p>
            </>
          ) : (
            <>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Application Access Required</h1>
              <p className="mt-4 leading-7 text-slate-600">Applications for OpenWorlds roles are position-specific. Choose a branch, review a position, then select Apply Here from its details page.</p>
            </>
          )}
          <p className="mt-3 text-sm leading-6 text-slate-500">Branch → Position → Position Details → Apply Here → Dedicated Application Page → Submit Application → Manual Review</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/careers" className="rounded-lg bg-[#0066cc] px-5 py-3 text-sm font-medium text-white hover:bg-[#004a99]">Go to Careers Portal</Link>
            {role && <Link to={`/careers/role/${role.slug}`} className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Return to position</Link>}
            <Link to="/" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Return Home</Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
