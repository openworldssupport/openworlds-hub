import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { ApplicationFields, applicationMessage, type ApplicationSection } from "@/components/ApplicationFormFields";
import { api } from "@/convex/_generated/api";
import { careerRoles } from "@/lib/careers";

export const careerSections: ApplicationSection[] = [
  {
    title: "About you",
    fields: [
      { name: "fullName", label: "Full name", required: true, maxLength: 100, placeholder: "How we should address you" },
      { name: "email", label: "Email", type: "email", required: true, maxLength: 254, placeholder: "you@example.com" },
      { name: "username", label: "OpenWorlds username", maxLength: 32, placeholder: "If you already have an account" },
      { name: "country", label: "Country or region", required: true, maxLength: 80 },
      { name: "timezone", label: "Time zone", required: true, maxLength: 60, placeholder: "e.g. Central European Time (UTC+1)" },
      { name: "portfolio", label: "Portfolio or profile link", type: "url", maxLength: 500, placeholder: "https://…" },
    ],
  },
  {
    title: "Volunteer availability",
    fields: [
      { name: "hoursPerWeek", label: "Hours you can volunteer each week", type: "select", required: true, options: ["1–3 hours", "4–6 hours", "7–10 hours", "11–15 hours", "16+ hours"] },
      { name: "startDate", label: "Earliest date you could start", type: "date", required: true },
      { name: "languages", label: "Languages you work in", required: true, maxLength: 120, placeholder: "e.g. English, Danish" },
    ],
  },
  {
    title: "Experience",
    fields: [
      { name: "experience", label: "Relevant experience", required: true, minLength: 10, maxLength: 2200, rows: 5, placeholder: "Share the experience, projects, or skills that relate to this position." },
      { name: "skills", label: "Skills, tools, and software you use", maxLength: 800, rows: 3, placeholder: "Anything you would bring to the work day to day." },
      { name: "projects", label: "Previous projects or work you are proud of", maxLength: 1400, rows: 4, placeholder: "Short descriptions, with links if they are public." },
      { name: "teamExperience", label: "Have you worked in a remote or volunteer team before?", type: "select", required: true, options: ["Yes, extensively", "Yes, briefly", "No, but I would like to"] },
    ],
  },
  {
    title: "Motivation",
    fields: [
      { name: "motivation", label: "Why are you interested in this role?", required: true, minLength: 10, maxLength: 2500, rows: 5, placeholder: "Tell us what interests you and what you would bring to the team." },
      { name: "firstMonth", label: "What would you focus on in your first month?", minLength: 10, maxLength: 1800, rows: 4, placeholder: "A few concrete things you would try to get right early." },
      { name: "challenge", label: "Describe a difficult problem you solved", maxLength: 1600, rows: 4, placeholder: "What the problem was, and how you approached it." },
      { name: "feedback", label: "How do you handle feedback and disagreement?", maxLength: 1200, rows: 3 },
    ],
  },
  {
    title: "Final details",
    fields: [
      { name: "heardFrom", label: "How did you hear about OpenWorlds?", type: "select", options: ["OpenWorlds game", "A friend or community member", "A creator or streamer", "Social media", "Search engine", "Other"] },
      { name: "anythingElse", label: "Anything else we should know?", maxLength: 1800, rows: 4, placeholder: "Optional notes, questions, or context for your application." },
    ],
  },
];

export default function CareerApplication() {
  const { roleSlug } = useParams();
  const role = careerRoles.find((item) => item.slug === roleSlug);
  const availability = useQuery(api.careerApplications.roleAvailability);
  const availabilityEntry = availability?.find((item) => item.slug === roleSlug);
  const isOpen = role ? availabilityEntry?.isOpen ?? role.status !== "Filled" : false;
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role || busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await submitEnquiry({
        type: "application",
        roleSlug: role.slug,
        name: String(values.get("fullName") ?? "").trim(),
        email: String(values.get("email") ?? "").trim(),
        portfolio: String(values.get("portfolio") ?? "").trim(),
        message: applicationMessage(values, careerSections),
        honeypot: String(values.get("website") ?? ""),
        privacyAccepted: values.get("careerConsent") === "on",
      });
      if (!result.accepted) throw new Error("Submission was not accepted.");
      setSent(true);
    } catch {
      setError("We couldn’t send your application. Check your details and try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link to={role ? `/careers/role/${role.slug}` : "/careers"} className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"><ArrowLeft className="size-4" /> Back to position</Link>
          <p className="mt-8 text-sm font-medium text-blue-100">OpenWorlds · Careers application</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{role?.title ?? "Position not found"}</h1>
          {role && <p className="mt-3 text-blue-50">{role.branch.title} · Voluntary, unpaid contributor role</p>}
        </div>
      </section>
      {!role ? (
        <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><p className="text-slate-600">This position may have moved or closed.</p><Link to="/careers" className="mt-4 inline-flex text-sm font-medium text-[#0066cc] hover:underline">Browse current positions</Link></section>
      ) : !isOpen ? (
        <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><p className="text-slate-600">This position is no longer accepting applications.</p><Link to={`/careers/role/${role.slug}`} className="mt-4 inline-flex text-sm font-medium text-[#0066cc] hover:underline">Back to position</Link></section>
      ) : (
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="mb-7 border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Application</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">This is a voluntary, unpaid contributor role with flexible hours. The application has a few sections and takes about ten minutes. Your application is sent directly to careers@openworlds.dk and kept private with the Careers team. The site retains only a hashed email and submission time for rate limiting.</p>
          </div>
          {sent ? (
            <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><h2 className="font-semibold">Application submitted</h2><p className="mt-1 leading-6">Thank you for applying. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot.</p></div></div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-7">
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label htmlFor="application-website">Website</label><input id="application-website" name="website" tabIndex={-1} autoComplete="off" /></div>
              <ApplicationFields sections={careerSections} />
              <p className="text-xs leading-5 text-slate-500">Please don’t include passwords or sensitive account information.</p>
              <div className="space-y-3">
                <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"><input name="careerConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" /><span>I agree that my email and application details will be emailed to the OpenWorlds Careers team. The site retains a hashed email and submission time for rate limiting.</span></label>
                <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"><input name="careerTerms" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" /><span>I understand that contributor roles are voluntary and unpaid, and that submitting an application does not guarantee a position.</span></label>
              </div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" disabled={busy}><Mail className="size-4" />{busy ? "Submitting application…" : "Submit application"}</Button>
            </form>
          )}
        </section>
      )}
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · All contributor roles are voluntary and unpaid.</footer>
    </main>
  );
}
