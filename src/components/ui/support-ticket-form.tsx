import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { supportReasons } from "@/lib/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function SupportTicketForm() {
  const createTicket = useMutation(api.supportTickets.create);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const payload = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    try {
      await createTicket({
        name: String(payload.get("name") ?? ""),
        email: String(payload.get("email") ?? ""),
        username: String(payload.get("username") ?? ""),
        reason: String(payload.get("reason") ?? ""),
        message: String(payload.get("message") ?? ""),
        honeypot: String(payload.get("company_website") ?? ""),
      });
      setStatus("sent");
    } catch (submissionError) {
      setStatus("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn’t open your ticket. Please try again.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Ticket received</p>
          <p className="mt-1 leading-6">
            Thanks for reaching out. Your ticket has been saved and sent to the OpenWorlds support team,
            who will reply to the email address you provided.
          </p>
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
        <p className="text-xs text-slate-500">We reply to this address, so make sure it is correct.</p>
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
        Your name, email, username, and message are sent only to the OpenWorlds support team so we can
        reply to you. We never sell or share them. Do not include passwords or payment details.
      </p>

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Opening ticket..." : "Open support ticket"}
      </Button>
    </form>
  );
}
