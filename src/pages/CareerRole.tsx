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
            <div><h2 className="font-semibold">About the role</h2><p className="mt-2 text-sm leading-6 text-slate-600">{role.summary}</p></div>
            <div><h2 className="font-semibold">What you’ll contribute</h2><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{role.responsibilities.map((item) => <li key={item} className="flex gap-2"><span className="text-[#0066cc]">·</span>{item}</li>)}</ul></div>
            <div><h2 className="font-semibold">What helps you succeed</h2><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{role.qualifications.map((item) => <li key={item} className="flex gap-2"><span className="text-[#7651c9]">·</span>{item}</li>)}</ul></div>
            <div><h2 className="font-semibold">Role details</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is a voluntary, unpaid contributor role. Apply below to send your interest to the OpenWorlds team for private review.</p></div>
          </div>
          {role.status === "Filled" ? (
            <p className="mt-8 text-sm font-medium text-slate-600">This position is filled and is not accepting applications.</p>
          ) : (
            <Link to={`/careers/apply/${role.slug}`} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Apply for this role <ArrowRight className="size-4" /></Link>
          )}
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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Application review</h1>            <p className="mt-3 text-blue-50">Private OpenWorlds administrator view.</p>
            <Link to="/staff" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white hover:underline"><ArrowLeft className="size-4" /> Staff workspace</Link>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {isLoading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Checking team access…</p>
        ) : !isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Application review is unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with an invited company account to view the application queue.</p>
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
                  <div><h2 className="font-semibold">{application.roleTitle}</h2><p className="mt-1 text-sm text-slate-600">{application.fullName}</p></div>
                  <time className="text-xs text-slate-500" dateTime={new Date(application.submittedAt).toISOString()}>{new Date(application.submittedAt).toLocaleString()}</time>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <p className="whitespace-pre-wrap"><strong>Experience:</strong> {application.experience}</p>
                  <p className="whitespace-pre-wrap"><strong>Why this role:</strong> {application.motivation}</p>
                  <p className="whitespace-pre-wrap"><strong>First weeks:</strong> {application.roleApproach}</p>
                  <p className="whitespace-pre-wrap"><strong>Collaboration:</strong> {application.collaboration}</p>
                  <p className="whitespace-pre-wrap"><strong>Availability:</strong> {application.availability}</p>
                  {application.strategyScenario && <p className="whitespace-pre-wrap"><strong>Scenario:</strong> {application.strategyScenario}</p>}
                  {application.successMeasures && <p className="whitespace-pre-wrap"><strong>Success measures:</strong> {application.successMeasures}</p>}
                  {application.decisionMaking && <p className="whitespace-pre-wrap"><strong>Decision-making:</strong> {application.decisionMaking}</p>}
                  {application.stakeholderCommunication && <p className="whitespace-pre-wrap"><strong>Stakeholder communication:</strong> {application.stakeholderCommunication}</p>}
                  {application.toolsAndStrengths && <p className="whitespace-pre-wrap"><strong>Tools &amp; strengths:</strong> {application.toolsAndStrengths}</p>}
                  {application.weeklyHours && <p><strong>Weekly hours:</strong> {application.weeklyHours}</p>}
                  {application.timeZone && <p><strong>Time zone:</strong> {application.timeZone}</p>}
                  {application.availabilityStart && <p><strong>Availability start:</strong> {application.availabilityStart}</p>}
                  {application.linkedin && <p><strong>LinkedIn:</strong> <a href={application.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#0066cc] underline">Profile</a></p>}
                  {application.portfolio && <p className="whitespace-pre-wrap"><strong>Work samples:</strong> {application.portfolio}</p>}
                </div>
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
  const role = careerRoles.find((item) => item.slug === roleSlug && item.status !== "Filled");
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
        roleApproach: String(formData.get("roleApproach") ?? ""),
        motivation: String(formData.get("motivation") ?? ""),
        collaboration: String(formData.get("collaboration") ?? ""),
        availability: String(formData.get("availability") ?? ""),
        portfolio: String(formData.get("portfolio") ?? ""),
        strategyScenario: String(formData.get("strategyScenario") ?? ""),
        successMeasures: String(formData.get("successMeasures") ?? ""),
        decisionMaking: String(formData.get("decisionMaking") ?? ""),
        stakeholderCommunication: String(formData.get("stakeholderCommunication") ?? ""),
        toolsAndStrengths: String(formData.get("toolsAndStrengths") ?? ""),
        weeklyHours: String(formData.get("weeklyHours") ?? ""),
        timeZone: String(formData.get("timeZone") ?? ""),
        availabilityStart: String(formData.get("availabilityStart") ?? ""),
        linkedin: String(formData.get("linkedin") ?? ""),
        voluntaryConsent: formData.get("voluntaryConsent") === "on",
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError("We couldn’t submit your application. Please check your details and try again.");
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
              <p className="mt-3 leading-7 text-slate-600">Your application for <strong>{role.title}</strong> has been saved. Email notification depends on the service configuration. Check the Careers page for current openings.</p>
              <Link to="/careers" className="mt-7 inline-flex rounded-lg bg-[#0066cc] px-5 py-3 text-sm font-medium text-white hover:bg-[#004a99]">Back to careers</Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium text-[#7651c9]">{role.branch.title.replace(/&/g, "and").replace(/\//g, " · ")}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Apply: {role.title}</h1>
              <p className="mt-3 leading-7 text-slate-600">Your detailed application will be saved for private team review. Email notification depends on the service configuration. Don’t include passwords or sensitive personal details. This is a voluntary, unpaid contributor role.</p>
              <form onSubmit={handleSubmit} className="mx-auto mt-7 max-w-2xl space-y-7 text-left">
                <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-2 text-base font-semibold">About you</legend>
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
                  <input id="fullName" name="fullName" required minLength={2} maxLength={100} autoComplete="name" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email address</label>
                  <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" />
                </div>
                </fieldset>
                <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-2 text-base font-semibold">Your background</legend>
                  <div className="space-y-2">
                  <label htmlFor="experience" className="text-sm font-medium">What relevant skills, experience, or projects would you bring to this role?</label>
                  <p className="text-xs text-slate-500">Mention tools, responsibilities, or outcomes related to this position.</p>
                  <Textarea id="experience" name="experience" required minLength={20} maxLength={4000} rows={5} placeholder="Describe your relevant skills and experience (at least 20 characters)." />
                  </div>
                  <div className="space-y-2"><label htmlFor="toolsAndStrengths" className="text-sm font-medium">Which tools, methods, or strengths would you use most in this role?</label><Textarea id="toolsAndStrengths" name="toolsAndStrengths" required minLength={20} maxLength={2000} rows={4} placeholder="Tell us what you’re confident using and where you want to grow." /></div>
                  <div className="space-y-2"><label htmlFor="portfolio" className="text-sm font-medium">Links to relevant work <span className="font-normal text-slate-500">(optional)</span></label><Textarea id="portfolio" name="portfolio" maxLength={2000} rows={3} placeholder="Portfolio, project, writing, design, or code links." /></div>
                  <div className="space-y-2"><label htmlFor="linkedin" className="text-sm font-medium">LinkedIn profile <span className="font-normal text-slate-500">(optional)</span></label><input id="linkedin" name="linkedin" type="url" maxLength={300} placeholder="https://www.linkedin.com/in/your-name" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" /></div>
                </fieldset>
                <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"><legend className="px-2 text-base font-semibold">Your thinking and approach</legend>
                <div className="space-y-2">
                  <label htmlFor="motivation" className="text-sm font-medium">Why do you want to contribute to OpenWorlds in this role?</label>
                  <Textarea id="motivation" name="motivation" required minLength={20} maxLength={4000} rows={4} placeholder="What interests you about this role and the project?" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="roleApproach" className="text-sm font-medium">What would you focus on during your first few weeks?</label>
                  <p className="text-xs text-slate-500">Share how you would learn the role, set priorities, and make progress.</p>
                  <Textarea id="roleApproach" name="roleApproach" required minLength={20} maxLength={4000} rows={5} placeholder="Describe how you would get started (at least 20 characters)." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="collaboration" className="text-sm font-medium">How do you work with a team, share updates, and handle feedback?</label>
                  <Textarea id="collaboration" name="collaboration" required minLength={20} maxLength={4000} rows={4} placeholder="Tell us about your communication and collaboration style." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="strategyScenario" className="text-sm font-medium">{role.slug === "business-strategy-associate" ? "Scenario: OpenWorlds has a limited contributor team and several possible priorities. How would you decide what to focus on next, and what information would you need?" : "Describe a challenging situation relevant to this role. How would you understand the problem, choose an approach, and learn whether it worked?"}</label>
                  <p className="text-xs text-slate-500">There isn’t one correct answer. We’re interested in your reasoning and assumptions.</p>
                  <Textarea id="strategyScenario" name="strategyScenario" required minLength={40} maxLength={4000} rows={6} placeholder="Walk through your reasoning step by step (at least 40 characters)." />
                </div>
                <div className="space-y-2"><label htmlFor="successMeasures" className="text-sm font-medium">What would meaningful progress look like after the first 1–3 months?</label><Textarea id="successMeasures" name="successMeasures" required minLength={20} maxLength={2000} rows={4} placeholder="Name outcomes or signals you would use to evaluate progress." /></div>
                <div className="space-y-2"><label htmlFor="decisionMaking" className="text-sm font-medium">How do you handle uncertainty or a disagreement about priorities?</label><Textarea id="decisionMaking" name="decisionMaking" required minLength={20} maxLength={2000} rows={4} placeholder="Explain how you’d gather context, communicate a decision, and revisit it." /></div>
                </fieldset>
                <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"><legend className="px-2 text-base font-semibold">Collaboration &amp; availability</legend>
                <div className="space-y-2">
                  <label htmlFor="availability" className="text-sm font-medium">What is your general availability?</label>
                  <p className="text-xs text-slate-500">A rough weekly estimate or preferred schedule is enough.</p>
                  <Textarea id="availability" name="availability" required minLength={10} maxLength={1000} rows={3} placeholder="For example: a few hours on weekends, or flexible hours on weekdays." />
                </div>
                <div className="space-y-2"><label htmlFor="stakeholderCommunication" className="text-sm font-medium">How would you keep teammates and stakeholders informed when plans change?</label><Textarea id="stakeholderCommunication" name="stakeholderCommunication" required minLength={20} maxLength={2000} rows={4} placeholder="Share how you communicate progress, risks, and decisions." /></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="weeklyHours" className="text-sm font-medium">Hours you could contribute weekly</label><input id="weeklyHours" name="weeklyHours" required maxLength={100} placeholder="e.g. 3–5 hours" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" /></div><div className="space-y-2"><label htmlFor="timeZone" className="text-sm font-medium">Time zone</label><input id="timeZone" name="timeZone" required maxLength={100} placeholder="e.g. UTC+1 / Copenhagen" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" /></div></div>
                <div className="space-y-2"><label htmlFor="availabilityStart" className="text-sm font-medium">When could you start?</label><input id="availabilityStart" name="availabilityStart" required maxLength={100} placeholder="e.g. Immediately, or from next month" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#7651c9]" /></div>
                </fieldset>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4"><h3 className="font-semibold">Privacy &amp; data use</h3><p className="mt-1 text-sm leading-6 text-slate-600">Your application is only shared with the company team for recruitment review. We use your email to contact you about this application. Do not provide passwords or sensitive personal information.</p></div>
                <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-700">
                  <input name="voluntaryConsent" type="checkbox" required className="mt-1 size-4 accent-[#0066cc]" />
                  <span>I understand this is a voluntary, unpaid contributor role.</span>
                </label>
                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">We couldn’t submit your application. Please check your details and try again.</p>}
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
