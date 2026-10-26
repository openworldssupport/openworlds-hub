import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Scale } from "lucide-react";
import { ACTIVE_TERMS_VERSION } from "@/lib/legalVersions";

type Section = { title: string; body: string[] };

export const termsSections: Section[] = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "These Terms describe use of the OpenWorlds website and game. By using these services, you agree to follow these Terms and the community rules.",
    ],
  },
  {
    title: "2. The service",
    body: [
      "OpenWorlds is a community project for creating, sharing, and exploring worlds. Website staff sign-in is invitation-only and uses a one-time email code. The game includes multiplayer features such as voice chat; use them respectfully and follow the community rules.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "Do not use the site to break the law, harm others, or interfere with the service.",
      "Do not attempt to gain unauthorised access to the site, its data, or other users' information, or to disrupt or overload the service.",
      "Do not submit spam, malware, or misleading information through any form.",
    ],
  },
  {
    title: "4. Community rules",
    body: [
      "Treat other people with respect. Harassment, discrimination, and hateful content are not allowed.",
      "Protect privacy: do not share or request other people's sensitive personal information.",
      "Only share content you have the right to share, and report harmful content when you see it.",
    ],
  },
  {
    title: "5. Support and careers enquiries",
    body: [
      "When you open a support ticket, the website stores its content and emails it to the support inbox. Authorized administrators can access ticket details. A generic ready-for-review notification may be sent to email addresses configured by an administrator. Do not include passwords, payment details, or unnecessary sensitive information.",
      "Applications and careers questions are sent by email to the careers inbox and are not stored as submissions in the website database. A hashed email and submission timestamp are retained for rate limiting, and configured alert addresses may receive a generic notification. The email provider sends an automated receipt confirmation. Any contributor role terms will be stated with the specific opening. An enquiry does not by itself create an employment relationship.",
      "We may decline or close a support request or careers enquiry at our discretion.",
    ],
  },
  {
    title: "6. Intellectual property",
    body: [
      "The site does not state who owns the OpenWorlds name, logo, or other content. Use the support form before reusing material if you are unsure.",
      "You retain any rights you already have in material you submit. You give OpenWorlds permission to receive, store where the service requires, review, and use that material only to respond to your request, assess an application, provide the service, or enforce these Terms. This does not grant OpenWorlds ownership of your work. Do not submit confidential or third-party material unless you have permission to share it.",
    ],
  },
  {
    title: "7. Third-party links",
    body: [
      "The website may link to other services, including Discord and YouTube. Those services are governed by their own terms and privacy policies.",
    ],
  },
  {
    title: "8. Disclaimers",
    body: [
      "The site and its content are provided “as is” and “as available”, without warranties of any kind, to the extent permitted by law.",
      "We do not guarantee that the site will always be available, error-free, or secure.",
    ],
  },
  {
    title: "9. Limitation of liability",
    body: [
      "To the extent permitted by law, OpenWorlds is not liable for indirect, incidental, or consequential losses arising from your use of the site.",
    ],
  },
  {
    title: "10. Changes to these terms",
    body: [
      "We may update these Terms as the website, game, or services change. The current version is shown above. Signed-in website users will be asked to review and accept the current versions when either these Terms or the Privacy Policy changes.",
    ],
  },
  {
    title: "11. Governing law",
    body: [
      "The operator's legal identity and location, and the applicable governing law, have not been provided. The operator must complete this section for the relevant jurisdiction before relying on these Terms.",
    ],
  },
  {
    title: "12. Contact",
    body: ["Questions about these Terms? Use the Support page at /support, which provides a way to contact the OpenWorlds team. The site operator's legal identity and location are not specified in this draft."],
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <Scale className="size-4" /> Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-blue-50">Version {ACTIVE_TERMS_VERSION} · Draft for legal review</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This is an informational draft, not legal advice or a confirmed legal agreement. The operator's legal identity, jurisdiction, age rules, and other service-specific details require review and completion before these Terms can be relied on.
        </p>

        <div className="mt-8 space-y-8">
          {termsSections.map((section) => (
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
          <Link to="/privacy" className="font-medium text-[#7651c9] hover:underline">Privacy Policy</Link>
          <Link to="/support" className="font-medium text-[#7651c9] hover:underline">Support</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        <p>OpenWorlds © 2026 · All rights reserved.</p>
        <p className="mt-1 text-xs">OpenWorlds is not currently a registered company.</p>
      </footer>
    </main>
  );
}
