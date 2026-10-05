import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";

type Section = { title: string; body: string[] };

const sections: Section[] = [
  {
    title: "1. Who we are",
    body: [
      "OpenWorlds is a community project for creating, sharing, and exploring worlds. In this policy, “we”, “us”, and “OpenWorlds” refer to the OpenWorlds team.",
      "For a privacy question or request, contact support@openworlds.dk. The site operator's legal identity and location are not specified in this draft.",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Support tickets: the reason you select, your message, and the email address you provide. Your name and OpenWorlds username are optional. Authorized company staff can view submitted tickets; configured email notifications may also include ticket details.",
      "Career applications: where an approved role is available, the form may collect your name, email address, answers, and optional work samples.",
      "Company sign-in: invited company email addresses and account access/assignment details are stored to provide private staff access.",
      "Hosting and service providers may process technical request data. The exact data and retention periods depend on provider configuration and are not specified here.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To reply to your support request and resolve the issue you reported.",
      "To review and respond to voluntary contributor applications.",
      "To manage company accounts and respond to website requests.",
      "To operate the website and its company sign-in and support features.",
    ],
  },
  {
    title: "4. Legal bases (where applicable)",
    body: [
      "The legal basis for each processing activity depends on the responsible operator and applicable law. This draft does not identify those details; confirm them with the site operator before relying on this notice.",
    ],
  },
  {
    title: "5. Sharing",
    body: [
      "Support ticket details may be sent to the configured email notification provider and are stored by the site's database provider. Other processing and sharing depend on the providers configured for the service.",
      "This page does not confirm a complete list of subprocessors or all sharing arrangements. Do not submit sensitive information through public forms.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "This site does not currently state fixed retention periods for tickets, applications, account records, or provider logs. Contact support@openworlds.dk with a data request or deletion question.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "Access to tickets and applications is restricted by the site's company-account authorization checks. No independent security review or comprehensive security controls are described here.",
      "No method of transmission or storage is fully secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "Applicable rights depend on the laws and jurisdiction governing the site's operator. Contact support@openworlds.dk with a request; this draft does not identify the operator or establish jurisdiction.",
      "To exercise any of these rights, contact support@openworlds.dk. We may need to verify your identity before acting.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "The site does not specify an age policy or establish how children's data is handled. Do not submit children's personal information through public forms.",
    ],
  },
  {
    title: "10. Cookies and local storage",
    body: [
      "The site uses authentication/session mechanisms for company sign-in. Other cookie, analytics, or local-storage use depends on the deployed platform and provider configuration; this page does not claim a complete inventory.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy as the project changes. When we do, we will revise the “last updated” date at the top of this page.",
    ],
  },
  {
    title: "12. Contact",
    body: ["For any question about this policy or your information, email support@openworlds.dk."],
  },
];

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <ShieldCheck className="size-4" /> Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-blue-50">Review date: October 2026 · Draft</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This is an informational draft, not a complete privacy notice or legal advice. Provider configuration and applicable business details have not been independently confirmed; review and complete this notice before relying on it.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-6 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="font-medium text-[#7651c9] hover:underline">Terms of Service</Link>
          <Link to="/support" className="font-medium text-[#7651c9] hover:underline">Support</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
