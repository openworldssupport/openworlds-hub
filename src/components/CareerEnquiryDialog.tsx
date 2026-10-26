import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { careerRoles } from "@/lib/careers";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { initialRoleSlug?: string; label: string; mode: "application" | "question" | "creator-application"; variant?: "default" | "outline" };

export function CareerEnquiryDialog({ initialRoleSlug, label, mode, variant = "default" }: Props) {
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [open, setOpen] = useState(false);
  const [roleSlug, setRoleSlug] = useState(initialRoleSlug ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const selectedRole = careerRoles.find((role) => role.slug === initialRoleSlug);
  const openRoles = careerRoles.filter((role) => role.status !== "Filled");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("careerConsent") !== "on") {
      setError("Please confirm that your message can be sent to the Careers team.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await submitEnquiry({
        type: mode,
        roleSlug: mode === "application" ? roleSlug : undefined,
        name: String(values.get("name") ?? ""),
        email: String(values.get("email") ?? ""),
        portfolio: String(values.get("portfolio") ?? ""),
        message: mode !== "question"
          ? [
              ...(mode === "creator-application" ? [["OpenWorlds username", "creatorUsername"]] : []),
              [mode === "creator-application" ? "Content creation experience" : "Relevant experience", "experience"],
              [mode === "creator-application" ? "Why I want to become an Official Content Creator" : "Why I’m interested and what I’d contribute", "motivation"],
            ].map(([fieldLabel, field]) => `${fieldLabel}:\n${String(values.get(field) ?? "").trim()}`).join("\n\n")
          : String(values.get("message") ?? ""),
        honeypot: String(values.get("website") ?? ""),
        privacyAccepted: values.get("careerConsent") === "on",
      });
      if (!result.accepted) throw new Error("Submission was not accepted.");
      form.reset();
      setSent(true);
    } catch {
      setError("We couldn’t send your message. Check the details and try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>
        <Mail className="size-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{sent ? (mode !== "question" ? "Application received" : "Question received") : mode === "creator-application" ? "Apply to become an Official Content Creator" : mode === "application" ? "Apply to OpenWorlds" : "Ask the Careers team"}</DialogTitle>
            <DialogDescription>
              {sent
                ? "Your submission has been sent to the Careers email system. Please check your inbox for a confirmation."
                : mode === "creator-application"
                  ? "Apply to join the OpenWorlds Official Content Creator program. Your application is emailed to the Careers team for review and is not stored as an application in the website database."
                  : mode === "application"
                    ? "Tell us about your experience and interest in the role. Your application is emailed to careers@openworlds.dk and is not stored as an application in the website database. The site keeps a hashed email and submission time for rate limiting."
                    : "Send a question to careers@openworlds.dk. Your message is emailed directly and is not stored as a submission in the website database. The site keeps a hashed email and submission time for rate limiting."}
            </DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>{mode !== "question" ? "Thank you for applying. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot." : "Thank you for contacting us. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot."}</p>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="career-website">Website</label>
                <input id="career-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              {mode === "application" && (
                <div className="space-y-2">
                  <Label htmlFor="career-role">Position</Label>
                  <select id="career-role" required value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Choose a current opening…</option>
                    {selectedRole?.status === "Filled" && <option value={selectedRole.slug} disabled>{selectedRole.title} — filled</option>}
                    {openRoles.map((role) => <option key={role.slug} value={role.slug}>{role.title}</option>)}
                  </select>
                </div>
              )}
              {mode === "creator-application" && <div className="space-y-2"><Label htmlFor="career-player-username">OpenWorlds username</Label><Input id="career-player-username" name="creatorUsername" required minLength={2} maxLength={32} autoComplete="username" placeholder="Your in-game username" /></div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="career-name">Name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="career-name" name="name" maxLength={100} autoComplete="name" /></div>
                <div className="space-y-2"><Label htmlFor="career-email">Email</Label><Input id="career-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
              </div>
              {mode !== "question" && <div className="space-y-2"><Label htmlFor="career-portfolio">Portfolio or relevant link <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="career-portfolio" name="portfolio" type="url" maxLength={500} placeholder="https://" /></div>}
              {mode !== "question" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="career-experience">{mode === "creator-application" ? "Content creation experience" : "Relevant experience"}</Label>
                    <Textarea id="career-experience" name="experience" required minLength={10} maxLength={2500} rows={4} placeholder="Share relevant experience, projects, or skills." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="career-motivation">{mode === "creator-application" ? "Why would you like to become an official creator?" : "Why are you interested in this role?"}</Label>
                    <Textarea id="career-motivation" name="motivation" required minLength={10} maxLength={2500} rows={4} placeholder={mode === "creator-application" ? "Tell us what you would create and why you want to represent OpenWorlds." : "Tell us what interests you and what you would bring to the team."} />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="career-message">Your question</Label>
                  <Textarea id="career-message" name="message" required minLength={20} maxLength={5000} rows={6} placeholder="How can the Careers team help?" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Please don’t include passwords or sensitive account information.</p>
              <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
                <input name="careerConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" />
                <span>I agree that my email and {mode !== "question" ? "application details" : "question"} will be emailed to the Careers team. My name is optional. The site keeps a hashed email and submission time for rate limiting; configured admin recipients may receive a generic ready-for-review notice.</span>
              </label>
              {error && <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? (mode !== "question" ? "Submitting application…" : "Sending…") : mode !== "question" ? "Submit application" : "Send question"}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
