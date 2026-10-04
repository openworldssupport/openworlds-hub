import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const form = event.currentTarget;
      const payload = new FormData(form);
      const data = new URLSearchParams();
      data.append("name", String(payload.get("name") ?? ""));
      data.append("email", String(payload.get("email") ?? ""));
      data.append("subject", String(payload.get("subject") ?? ""));
      data.append("message", String(payload.get("message") ?? ""));

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data.toString(),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Could not send your message.");
      }

      setStatus("sent");
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Could not send your message.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {status === "sent" ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Thanks! Your message has been sent to the OpenWorlds team.</span>
        </div>
      ) : (
        <>
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
        </>
      )}
    </form>
  );
}
