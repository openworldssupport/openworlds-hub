import { SiteNav } from "@/components/SiteNav";
import { careerRoles } from "@/lib/careers";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Textarea } from "@/components/ui/textarea";

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
        <div className="rounded-xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md bg-slate-100 px-3 py-1.5">Department: {role.department}</span>
            <span className="rounded-md bg-blue-50 px-3 py-1.5 font-medium text-[#0052a3]">{role.status}</span>
            <span className="rounded-md bg-violet-50 px-3 py-1.5 font-medium text-[#7651c9]">Voluntary · unpaid</span>
          </div>
          <div className="mt-8 space-y-6 border-t border-slate-200 pt-6">
            <div><h2 className="font-semibold">Department</h2><p className="mt-2 text-sm leading-6 text-slate-600">{role.branch.title.replace(/&/g, "and").replace(/\//g, " · ")}: {role.branch.summary}</p></div>
            <div><h2 className="font-semibold">Role details</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is a voluntary, unpaid contributor role. Apply below to send your interest to the OpenWorlds team for review.</p></div>
          </div>
          <Link to={`/careers/apply/${role.slug}`} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Apply for this role <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  );
}

export default CareerRole;

export function CareerApplicationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const applications = useQuery(api.careerApplications.listForAdmin, isAuthenticated ? {} : "skip");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Application review</h1>
          <p className="mt-3 text-blue-50">Private OpenWorlds team view.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {isLoading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Checking team access…</p>
        ) : !isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Administrator access required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Application review is limited to OpenWorlds administrators. Staff sign-in is not available until the account service is connected.</p>
          </div>
        ) : applications === undefined ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading applications…</p>
        ) : applications === null ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Administrator access is required to view applications.</p>
        ) : applications.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No applications have been submitted.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <article key={application._id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="font-semibold">{application.roleTitle}</h2><p className="mt-1 text-sm text-slate-600">{application.fullName} · <a href={`mailto:${application.email}`} className="text-[#0066cc] hover:underline">{application.email}</a></p></div>
                  <time className="text-xs text-slate-500" dateTime={new Date(application.submittedAt).toISOString()}>{new Date(application.submittedAt).toLocaleString()}</time>
                </div>
                {application.experience && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700"><strong>Experience:</strong> {application.experience}</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700"><strong>Interest:</strong> {application.motivation}</p>
                <p className="mt-3 text-xs font-medium text-[#7651c9]">Voluntary · unpaid · {application.status}</p>
              </article>
            ))}
          </div>
        )}
        <Link to="/careers" className="mt-7 inline-flex text-sm font-medium text-[#7651c9] hover:underline">Back to careers</Link>
      </section>
    </main>
  );
}

export function CareerApplicationGateway() {
  const { roleSlug } = useParams();
  const role = careerRoles.find((item) => item.slug === roleSlug);
  const submitApplication = useMutation(api.careerApplications.submit);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!role || isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      await submitApplication({
        roleSlug: role.slug,
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        experience: String(formData.get("experience") ?? ""),
        motivation: String(formData.get("motivation") ?? ""),
        voluntaryConsent: formData.get("voluntaryConsent") === "on",
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn’t submit your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/25 bg-white p-6 text-left text-slate-900 sm:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-50 text-[#7651c9]"><BriefcaseBusiness className="size-6" /></div>
          {!role ? (
            <>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{roleSlug ? "Position not found" : "Choose a position"}</h1>
              <p className="mt-4 leading-7 text-slate-600">{roleSlug ? "That position is not available." : "Browse voluntary, unpaid roles and choose one to apply for."}</p>
              <Link to="/careers" className="mt-7 inline-flex rounded-lg bg-[#0066cc] px-5 py-3 text-sm font-medium text-white hover:bg-[#004a99]">Browse positions</Link>
            </>
          ) : submitted ? (
            <>
              <CheckCircle2 className="mx-auto mt-4 size-10 text-emerald-600" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Application received</h1>
              <p className="mt-3 leading-7 text-slate-600">Your application for <strong>{role.title}</strong> has been saved for the OpenWorlds team to review. This is a voluntary, unpaid role.</p>
              <Link to="/careers" className="mt-7 inline-flex rounded-lg bg-[#0066cc] px-5 py-3 text-sm font-medium text-white hover:bg-[#004a99]">Back to careers</Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium text-[#7651c9]">{role.branch.title.replace(/&/g, "and").replace(/\//g, " · ")}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Apply: {role.title}</h1>
              <p className="mt-3 leading-7 text-slate-600">This is a voluntary, unpaid role. Your name, email, and answers will be saved for the OpenWorlds team to review. Don’t include passwords or sensitive personal details.</p>
              <form onSubmit={handleSubmit} className="mx-auto mt-7 max-w-2xl space-y-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
                  <input id="fullName" name="fullName" required minLength={2} maxLength={100} autoComplete="name" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email address</label>
                  <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="experience" className="text-sm font-medium">Relevant experience <span className="font-normal text-slate-500">(optional)</span></label>
                  <Textarea id="experience" name="experience" maxLength={4000} rows={3} placeholder="Share relevant skills or projects." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="motivation" className="text-sm font-medium">Why are you interested in this role?</label>
                  <Textarea id="motivation" name="motivation" required minLength={20} maxLength={4000} rows={4} placeholder="Tell us a little about your interest (at least 20 characters)." />
                </div>
                <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-700">
                  <input name="voluntaryConsent" type="checkbox" required className="mt-1 size-4 accent-[#0066cc]" />
                  <span>I understand this is a voluntary, unpaid contributor role.</span>
                </label>
                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Submitting…" : "Submit application"}</button>
                  <Link to={`/careers/role/${role.slug}`} className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to position</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · All positions are voluntary and unpaid.</footer>
    </main>
  );
}
