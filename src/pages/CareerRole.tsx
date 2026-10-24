import { SiteNav } from "@/components/SiteNav";
import { careerRoles } from "@/lib/careers";
import { ArrowLeft, ArrowRight, BriefcaseBusiness } from "lucide-react";
import { CareerEnquiryDialog } from "@/components/CareerEnquiryDialog";
import { Link, useParams } from "react-router";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function CareerRole() {
  const { roleSlug } = useParams();
  const availability = useQuery(api.careerApplications.roleAvailability);
  const availabilityEntry = availability?.find((item) => item.slug === roleSlug);
  const role = careerRoles.find((item) => item.slug === roleSlug);
  const roleIsOpen = role ? availabilityEntry?.isOpen ?? role.status !== "Filled" : false;

  if (!role) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <SiteNav />
        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h1 className="text-3xl font-semibold">Position not found</h1>
          <p className="mt-3 text-slate-600">That role may have moved or is no longer listed.</p>
          <Link to="/careers" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#7651c9]"><ArrowLeft className="size-4" /> Back to careers</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link to="/careers" className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"><ArrowLeft className="size-4" /> All positions</Link>
          <div className="mt-8 flex size-12 items-center justify-center rounded-xl bg-white/15 text-amber-200"><BriefcaseBusiness className="size-6" /></div>
          <p className="mt-5 text-sm font-medium text-blue-100">{role.branch.title.replace(/&/g, "and").replace(/\//g, " · ")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{role.title}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <article className="border-y border-slate-200 py-6">
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md bg-slate-100 px-3 py-1.5">Department: {role.department}</span>
            <span className={`rounded-md px-3 py-1.5 font-medium ${roleIsOpen ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{roleIsOpen ? "Open" : "Filled"}</span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5">Voluntary · unpaid</span>
          </div>
          <div className="mt-8 space-y-6">
            <div><h2 className="font-semibold">Department</h2><p className="mt-2 text-sm leading-6 text-slate-600">{role.branch.title.replace(/&/g, "and").replace(/\//g, " · ")}: {role.branch.summary}</p></div>
            <div><h2 className="font-semibold">About the role</h2><p className="mt-2 text-sm leading-6 text-slate-600">{role.summary}</p></div>
            <div><h2 className="font-semibold">What you’ll contribute</h2><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{role.responsibilities.map((item) => <li key={item} className="flex gap-2"><span className="text-[#0066cc]">·</span>{item}</li>)}</ul></div>
            <div><h2 className="font-semibold">What helps you succeed</h2><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{role.qualifications.map((item) => <li key={item} className="flex gap-2"><span className="text-[#0066cc]">·</span>{item}</li>)}</ul></div>
            <div><h2 className="font-semibold">How to get in touch</h2><p className="mt-2 text-sm leading-6 text-slate-600">Apply using the application form below. It asks for your relevant experience and why you’re interested in the role, then emails your application directly to the Careers inbox. Applications are not saved on the website or reviewed in the staff portal.</p></div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
            {roleIsOpen ? (
              <CareerEnquiryDialog label="Apply for this position" initialRoleSlug={role.slug} mode="application" />
            ) : (
              <p className="text-sm font-medium text-slate-600">This position is filled and is not accepting enquiries.</p>
            )}
            <Link to="/careers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">All positions <ArrowRight className="size-4" /></Link>
          </div>
        </article>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Contributor roles are voluntary and unpaid.</footer>
    </main>
  );
}

export default CareerRole;
