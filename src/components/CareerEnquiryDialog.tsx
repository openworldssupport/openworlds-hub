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

type Props = { initialRoleSlug?: string; label: string; variant?: "default" | "outline" };

export function CareerEnquiryDialog({ initialRoleSlug, label, variant = "default" }: Props) {
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"application" | "question">(initialRoleSlug ? "application" : "question");
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
        type,
        roleSlug: type === "application" ? roleSlug : undefined,
        name: String(values.get("name") ?? ""),
        email: String(values.get("email") ?? ""),
        portfolio: String(values.get("portfolio") ?? ""),
        message: String(values.get("message") ?? ""),
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
            <DialogTitle>{sent ? "Message received" : "Contact OpenWorlds Careers"}</DialogTitle>
            <DialogDescription>
              {sent
                ? "Your message has been submitted to the Careers email system. Please check your inbox for a confirmation."
                : "Applications and careers questions go directly to careers@openworlds.dk. They are not stored in the website or reviewed in the staff portal."}
            </DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>Thank you for contacting us. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot.</p>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="career-website">Website</label>
                <input id="career-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-type">I want to</Label>
                <select id="career-type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="application">Apply for a position</option>
                  <option value="question">Ask a question</option>
                </select>
              </div>
              {type === "application" && (
                <div className="space-y-2">
                  <Label htmlFor="career-role">Position</Label>
                  <select id="career-role" required value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Choose a current opening…</option>
                    {selectedRole?.status === "Filled" && <option value={selectedRole.slug} disabled>{selectedRole.title} — filled</option>}
                    {openRoles.map((role) => <option key={role.slug} value={role.slug}>{role.title}</option>)}
                  </select>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="career-name">Name</Label><Input id="career-name" name="name" required maxLength={100} autoComplete="name" /></div>
                <div className="space-y-2"><Label htmlFor="career-email">Email</Label><Input id="career-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
              </div>
              {type === "application" && <div className="space-y-2"><Label htmlFor="career-portfolio">Portfolio or relevant link <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="career-portfolio" name="portfolio" type="url" maxLength={500} placeholder="https://" /></div>}
              <div className="space-y-2">
                <Label htmlFor="career-message">{type === "application" ? "Your application" : "Your question"}</Label>
                <Textarea id="career-message" name="message" required minLength={20} maxLength={5000} rows={6} placeholder={type === "application" ? "Tell us about your experience and why you’re interested." : "How can the Careers team help?"} />
                <p className="text-xs text-muted-foreground">Please don’t include passwords or sensitive account information.</p>
              </div>
              <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
                <input name="careerConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" />
                <span>I agree that my name, email, and message will be emailed to the Careers team so they can respond. The website does not save the message.</span>
              </label>
              {error && <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? "Sending…" : type === "application" ? "Send application" : "Send question"}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
