import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ContactForm() {
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
        reason: "other",
        subject: String(payload.get("subject") ?? ""),
        message: String(payload.get("message") ?? ""),
      });
      setStatus("sent");
    } catch (submissionError) {
      setStatus("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn’t send your message. Please try again.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle2 className="size-5 shrink-0" />
        <span>Thanks! Your message has been sent to the OpenWorlds support team.</span>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          placeholder="Support question / feedback"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          placeholder="Tell us how we can help."
        />
      </div>

      {status === "error" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
