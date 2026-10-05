import { SiteNav } from "@/components/SiteNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SupportTicketForm } from "@/components/ui/support-ticket-form";
import { ClipboardCheck, LifeBuoy, Mail } from "lucide-react";

const faqs = [
  {
    question: "How do I play OpenWorlds?",
    answer:
      "OpenWorlds is still in development. When an official build is ready it will be listed on the Downloads page, and we do not share links from anywhere else.",
  },
  {
    question: "Is OpenWorlds free to play?",
    answer:
      "There is no paid release yet, and no pricing has been announced. Any future pricing or paid features will be clearly stated on the official site before launch.",
  },
  {
    question: "How do I create and share a world?",
    answer:
      "World creation tools are not publicly available yet. Join the Discord community to follow development and be among the first to try them.",
  },
  {
    question: "How does company sign-in work?",
    answer:
      "Company accounts are invite-only and use a one-time email code. Public player accounts and sign-up are not available through this website yet.",
  },
  {
    question: "How do I report a player or content?",
    answer:
      "Open a ticket with the reason “Report a player” or “Report content or a world”. Include usernames and any links, screenshots, or world names that help us review it.",
  },
  {
    question: "Where can I download the game?",
    answer:
      "There are no official downloads right now. Only the Downloads page will list official builds, so treat anything else as unverified.",
  },
  {
    question: "Are the Learning lessons available yet?",
    answer:
      "No learning guides are published yet. The Learning page will be updated when materials are available.",
  },
  {
    question: "Are there contributor openings?",
    answer:
      "There are no confirmed openings listed right now. If openings are approved, they will appear on the Careers page.",
  },
  {
    question: "How quickly will I get a reply?",
    answer:
      "We do not publish a guaranteed response time. Include a working email address so the team can reply when able.",
  },
  {
    question: "How else can I contact the team?",
    answer:
      "You can also email support@openworlds.dk directly, or join the official Discord linked from the Community page.",
  },
];

export default function Support() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <LifeBuoy className="size-4" /> OpenWorlds Support
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">How can we help?</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            Read the information below or open a support ticket. Include a working email address if you need a reply.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#ticket" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">
              Open a support ticket
            </a>
            <a href="#faq" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Read common questions
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-16">
          <p className="text-sm font-medium text-[#7651c9]">Common questions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">              Information about the website and how to contact the team.
          </p>

          <Accordion type="single" collapsible className="mt-8 rounded-xl border border-slate-200 bg-white px-5 sm:px-6">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-base font-medium text-slate-900">{faq.question}</AccordionTrigger>
                <AccordionContent className="leading-6 text-slate-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <Mail className="size-5 text-[#0066cc]" />
            <span>Prefer email? Write to <a href="mailto:support@openworlds.dk" className="font-medium text-[#0066cc] hover:underline">support@openworlds.dk</a>.</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <ClipboardCheck className="size-5 text-[#0066cc]" />
            <span>Already opened a ticket? <a href="/support/status" className="font-medium text-[#0066cc] hover:underline">Check its status</a> with your reference number.</span>
          </div>
        </div>
      </section>

      <section id="ticket" className="scroll-mt-24 bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-[#7651c9]">Support ticket</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Open a ticket</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Describe your question or issue and provide an email address where the team can contact you.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-600">
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Your email is required</span>
                  <p className="mt-1 leading-6">It is the address we reply to, so we can only help if it is correct.</p>
                </li>
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Pick the closest reason</span>
                  <p className="mt-1 leading-6">Choose the closest match so the team can review it.</p>
                </li>
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Stay safe</span>
                  <p className="mt-1 leading-6">Never include your password or payment details in a ticket.</p>
                </li>
                <li className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
                  <span className="font-medium text-slate-900">Ticket access</span>
                  <p className="mt-1 leading-6">Ticket details are available to authorized company accounts for support handling. See the Privacy Policy for details.</p>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 shadow-sm sm:p-8">
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
