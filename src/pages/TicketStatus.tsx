import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router";
import { ClipboardCheck, Search } from "lucide-react";

const statusLabels: Record<string, string> = {
  open: "Open — awaiting a response",
  responded: "Answered — a reply has been sent to your email",
  "in-progress": "In progress — a team member is looking into it",
  resolved: "Resolved",
  closed: "Closed — this ticket is no longer active",
};

export default function TicketStatus() {
  const [submitted, setSubmitted] = useState<{ reference: string; email: string } | null>(null);
  const result = useQuery(
    api.supportTickets.lookup,
    submitted ? { reference: submitted.reference, email: submitted.email } : "skip",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const reference = String(data.get("reference") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!reference || !email) return;
    setSubmitted({ reference, email });
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <ClipboardCheck className="size-4" /> OpenWorlds Support
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Check ticket status</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Enter the reference from your ticket confirmation and the email you used, and we will show its
            current status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-7">
          <div className="space-y-2">
            <Label htmlFor="status-reference">
              Ticket reference <span className="text-[#7651c9]">*</span>
            </Label>
            <Input id="status-reference" name="reference" required placeholder="OW-XXXXXXXX" className="font-mono uppercase" />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="status-email">
              Email used on the ticket <span className="text-[#7651c9]">*</span>
            </Label>
            <Input id="status-email" name="email" type="email" required placeholder="you@example.com" />
          </div>

          <Button type="submit" className="mt-6 w-full">
            <Search className="size-4" /> Look up ticket
          </Button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            For your privacy, both the reference and the matching email are required. We never reveal ticket
            details to anyone who does not have both.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            We aim to reply within 3 days. A ticket reads as “open” until then, moves to “answered” once the
            reply window has passed, and closes automatically after 14 days of inactivity.
          </p>
        </form>

        {submitted && (
          <div className="mt-6">
            {result === undefined ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Checking…</p>
            ) : result === null ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="font-semibold text-amber-900">No matching ticket found</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  We could not find a ticket with that reference and email. Double-check both, then try again.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-6">
                <h2 className="font-semibold">Ticket found</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3">
                    <dt className="text-slate-500">Reference</dt>
                    <dd className="font-mono font-medium">{result.reference}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3">
                    <dt className="text-slate-500">Reason</dt>
                    <dd className="font-medium">{result.reasonLabel}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="font-medium">{statusLabels[result.status] ?? result.status}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">Submitted</dt>
                    <dd className="font-medium">{new Date(result.submittedAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/support" className="font-medium text-[#7651c9] hover:underline">Back to support</Link>
          <Link to="/support#ticket" className="font-medium text-[#7651c9] hover:underline">Open a new ticket</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
