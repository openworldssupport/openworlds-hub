import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { supportReasons } from "@/lib/support";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function SupportTicketForm() {
  const createTicket = useMutation(api.supportTickets.create);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const payload = new FormData(event.currentTarget);
    if (payload.get("privacyAndTerms") !== "on") {
      setError("You must accept our Privacy Policy and Terms of Service before opening a ticket.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");

    try {
      const result = await createTicket({
        name: String(payload.get("name") ?? ""),
        email: String(payload.get("email") ?? ""),
        username: String(payload.get("username") ?? ""),
        reason: String(payload.get("reason") ?? ""),
        message: String(payload.get("message") ?? ""),
        honeypot: String(payload.get("company_website") ?? ""),
        privacyAndTermsAccepted: payload.get("privacyAndTerms") === "on",
      });
      setReference(result?.reference ?? null);
      setStatus("sent");
    } catch (submissionError) {
      setStatus("error");
      setError("We couldn’t open your ticket. Please check your details and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Ticket received</p>
          <p className="mt-1 leading-6">
            Your ticket has been saved. Email notification depends on the support inbox configuration; a reply is not guaranteed.
          </p>
          {reference && (
            <p className="mt-3 rounded-lg border border-emerald-300 bg-white p-3">
              Your reference: <span className="font-mono font-semibold tracking-wide">{reference}</span>
              <span className="mt-1 block text-xs text-slate-600">
                Keep this reference to look up the ticket status later.
              </span>
            </p>
          )}
          <a
            href="/support/status"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0066cc] hover:underline"
          >
            Check ticket status
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Hidden honeypot field: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-name">
          Name <span className="font-normal text-slate-500">(optional)</span>
        </Label>
        <Input id="ticket-name" name="name" type="text" maxLength={100} autoComplete="name" placeholder="Your name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-email">
          Email <span className="text-[#7651c9]">*</span>
        </Label>
        <p className="text-xs text-slate-500">Use an address where you can receive a reply. A response is not guaranteed.</p>
        <Input
          id="ticket-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-username">
          OpenWorlds username <span className="font-normal text-slate-500">(optional)</span>
        </Label>
        <Input id="ticket-username" name="username" type="text" maxLength={50} placeholder="Your in-game or community username" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-reason">
          What is this about? <span className="text-[#7651c9]">*</span>
        </Label>
        <select
          id="ticket-reason"
          name="reason"
          required
          defaultValue=""
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="" disabled>
            Choose a reason…
          </option>
          {supportReasons.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-message">
          Tell us what happened <span className="text-[#7651c9]">*</span>
        </Label>
        <p className="text-xs text-slate-500">Include any steps to reproduce, world names, or details that help us investigate.</p>
        <Textarea
          id="ticket-message"
          name="message"
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          placeholder="Describe your request in at least 20 characters. Do not include your password."
        />
      </div>

      {status === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Your ticket is stored on the service and can be read by authorized company staff. The support email notification may include the details you submit. Do not include passwords or payment details.
      </p>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-2.5 text-sm font-medium text-slate-700" htmlFor="privacy-and-terms">
          <input
            id="privacy-and-terms"
            name="privacyAndTerms"
            type="checkbox"
            required
            className="mt-0.5 size-4 shrink-0 accent-[#0066cc]"
          />
          <span>
            I agree to the OpenWorlds{" "}
            <Link to="/privacy" className="font-medium text-[#0066cc] hover:underline">Privacy Policy</Link>{" "}
            and{" "}
            <Link to="/terms" className="font-medium text-[#0066cc] hover:underline">Terms of Service</Link>.
          </span>
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Your ticket cannot be opened until you agree. Review the Privacy Policy for information about ticket data and use the support form for privacy questions.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Opening ticket..." : "Open support ticket"}
      </Button>
    </form>
  );
}
