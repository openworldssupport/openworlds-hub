import { SiteNav } from "@/components/SiteNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SupportTicketForm } from "@/components/ui/support-ticket-form";
import { LifeBuoy, Mail } from "lucide-react";

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
    question: "I can't sign in or I forgot my password.",
    answer:
      "Open the support ticket form below with the reason “Account or sign-in help” or “Password or email change”. Never send your password — we will never ask for it.",
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
      "The Learning library lists planned topics, not published lessons. When guides are ready they will be linked from the Learning page.",
  },
  {
    question: "How do I apply for a contributor role?",
    answer:
      "All roles are voluntary, unpaid contributor positions. Browse them on the Careers page and apply from a role's detail page. For help with an application, open a ticket with the reason “Careers application help”.",
  },
  {
    question: "How quickly will I get a reply?",
    answer:
      "We aim to reply to support tickets within a few business days. Complex reports, such as abuse or payment investigations, can take longer.",
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
            Browse the answers to questions we get most often, or open a support ticket and our team will
            reply to your email.
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
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Short answers to the questions we hear most. If yours is not covered, open a ticket below.
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
        </div>
      </section>

      <section id="ticket" className="scroll-mt-24 bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-[#7651c9]">Support ticket</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Open a ticket</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Tell us what is going on and we will get back to you by email. A few details up front help us
                resolve your request faster.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-600">
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Your email is required</span>
                  <p className="mt-1 leading-6">It is the address we reply to, so we can only help if it is correct.</p>
                </li>
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Pick the closest reason</span>
                  <p className="mt-1 leading-6">It routes your ticket to the right part of the team.</p>
                </li>
                <li className="rounded-lg border border-slate-200 bg-white p-4">
                  <span className="font-medium text-slate-900">Stay safe</span>
                  <p className="mt-1 leading-6">Never include your password or payment details in a ticket.</p>
                </li>
                <li className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
                  <span className="font-medium text-slate-900">Your details stay private</span>
                  <p className="mt-1 leading-6">Only the OpenWorlds support team can read your ticket. We use your email to reply to you and never sell or share your details with anyone else.</p>
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
