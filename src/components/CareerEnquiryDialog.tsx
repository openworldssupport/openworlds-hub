import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { CreatorApplicationForm } from "@/components/CreatorApplicationForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { label: string; mode: "question" | "creator-application"; variant?: "default" | "outline" };

export function CareerEnquiryDialog({ label, mode, variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const isCreator = mode === "creator-application";

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>
        <Mail className="size-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isCreator ? "Apply to become an Official Content Creator" : "Ask the Careers team"}</DialogTitle>
            <DialogDescription>
              {isCreator
                ? "Apply to join the OpenWorlds Creator Program. Your application is emailed to the Careers team and is not stored in the website database. Applying does not grant a verified badge; admins add approved creators to the official roster after review."
                : "Send a question to careers@openworlds.dk. Your message is emailed directly and is not stored as a submission in the website database. The site keeps a hashed email and submission time for rate limiting."}
            </DialogDescription>
          </DialogHeader>
          {isCreator ? <CreatorApplicationForm /> : <QuestionForm />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuestionForm() {
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    if (values.get("careerConsent") !== "on") {
      setError("Please confirm that your message can be sent to the Careers team.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await submitEnquiry({
        type: "question",
        name: String(values.get("name") ?? ""),
        email: String(values.get("email") ?? ""),
        message: String(values.get("message") ?? ""),
        honeypot: String(values.get("website") ?? ""),
        privacyAccepted: true,
      });
      if (!result.accepted) throw new Error("Submission was not accepted.");
      setSent(true);
    } catch {
      setError("We couldn’t send your message. Check the details and try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <p>Question sent. Please check your inbox for an automated confirmation from OpenWorlds Careers Bot.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="career-website">Website</label>
        <input id="career-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="career-name">Name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="career-name" name="name" maxLength={100} autoComplete="name" /></div>
        <div className="space-y-2"><Label htmlFor="career-email">Email</Label><Input id="career-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="career-message">Your question</Label>
        <Textarea id="career-message" name="message" required minLength={20} maxLength={5000} rows={6} placeholder="How can the Careers team help?" />
      </div>
      <p className="text-xs text-muted-foreground">Please don’t include passwords or sensitive account information.</p>
      <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
        <input name="careerConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" />
        <span>I agree that my email and question will be emailed to the Careers team. The site keeps a hashed email and submission time for rate limiting.</span>
      </label>
      {error && <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send question"}</Button></div>
    </form>
  );
}
