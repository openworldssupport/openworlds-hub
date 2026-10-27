import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { careerRoles } from "@/lib/careers";

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
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const result = await submitEnquiry({
        type: "application",
        roleSlug: role.slug,
        name: String(values.get("name") ?? ""),
        email: String(values.get("email") ?? ""),
        message: [
          ["Relevant experience", "experience"],
          ["Why I’m interested and what I’d contribute", "motivation"],
        ].map(([label, field]) => `${label}:\n${String(values.get(field) ?? "").trim()}`).join("\n\n"),
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
            <p className="mt-2 text-sm leading-6 text-slate-600">Tell us about your experience and interest in the position. Your application is emailed to careers@openworlds.dk and is not stored as an application in the website database. The site retains a hashed email and submission time for rate limiting.</p>
          </div>
          {sent ? (
            <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><h2 className="font-semibold">Application submitted</h2><p className="mt-1 leading-6">Thank you for applying. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot.</p></div></div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label htmlFor="application-website">Website</label><input id="application-website" name="website" tabIndex={-1} autoComplete="off" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="application-name">Name <span className="font-normal text-slate-500">(optional)</span></Label><Input id="application-name" name="name" maxLength={100} autoComplete="name" /></div>
                <div className="space-y-2"><Label htmlFor="application-email">Email</Label><Input id="application-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="application-experience">Relevant experience</Label><Textarea id="application-experience" name="experience" required minLength={10} maxLength={2500} rows={5} placeholder="Share relevant experience, projects, or skills." /></div>
              <div className="space-y-2"><Label htmlFor="application-motivation">Why are you interested in this role?</Label><Textarea id="application-motivation" name="motivation" required minLength={10} maxLength={2500} rows={5} placeholder="Tell us what interests you and what you would bring to the team." /></div>
              <p className="text-xs leading-5 text-slate-500">Please don’t include passwords or sensitive account information.</p>
              <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"><input name="careerConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" /><span>I agree that my email and application details will be emailed to the Careers team. My name is optional. The site retains a hashed email and submission time for rate limiting.</span></label>
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
