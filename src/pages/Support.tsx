import { SiteNav } from "@/components/SiteNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SupportTicketForm } from "@/components/ui/support-ticket-form";
import { ClipboardCheck } from "lucide-react";

const faqs = [

  {
    question: "How do I create and share a world?",
    answer:
      "World creation tools are not publicly available yet. This website does not currently provide a public world-creation flow.",
  },
  {
    question: "How does company sign-in work?",
    answer:
      "Company accounts are invite-only and use a one-time email code. Public player accounts and sign-up are not available through this website yet.",
  },
  {
    question: "How do I report a player or content?",
    answer:
      "You can submit a support ticket about a person or content. Include only information needed to explain the concern; ticket details are available to authorized company staff.",
  },
  {
    question: "How can I contact the team?",
    answer:
      "Send us a ticket. We usually reply by email.",
  },
];

export default function Support() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds Support</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">How can we help?</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Open a ticket and our team will contact you by email as soon as possible. You’ll receive an automated confirmation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#ticket" className="rounded-sm bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">
              Open a support ticket
            </a>
            <a href="#faq" className="rounded-sm border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Read common questions
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-16">
          <p className="text-sm font-medium text-[#7651c9]">Common questions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Information about the website and how to contact the team.</p>

          <Accordion type="single" collapsible className="mt-8 rounded-xl border border-slate-200 bg-white px-5 sm:px-6">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-base font-medium text-slate-900">{faq.question}</AccordionTrigger>
                <AccordionContent className="leading-6 text-slate-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <ClipboardCheck className="size-5 text-[#0066cc]" />
            <span>Already opened a ticket? <a href="/support/status" className="font-medium text-[#0066cc] hover:underline">Check its status</a> with your reference number.</span>
          </div>
        </div>
      </section>

      <section id="ticket" className="scroll-mt-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-[#7651c9]">Support ticket</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Open a ticket</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Describe your issue and include an email address where we can reach you.
              </p>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Your ticket is private to authorized support staff. Don’t include passwords or payment details.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
              <SupportTicketForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
