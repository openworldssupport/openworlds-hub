import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Scale } from "lucide-react";

type Section = { title: string; body: string[] };

const sections: Section[] = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "This page is an informational draft. It does not establish that the site operator has adopted these terms as a binding agreement.",
    ],
  },
  {
    title: "2. The service",
    body: [
      "OpenWorlds is a community website for creating, sharing, and exploring worlds. Some features described on the site are planned and not yet available. No OpenWorlds Meta Quest app is currently published through this website.",
      "Public player accounts and game downloads are not available through this website. Company sign-in is invitation-only and uses a one-time email code. If OpenWorlds is submitted to the Meta Horizon Store, the App Website URL is required and must open a working page relevant to the app or publisher, meet Meta's Content Guidelines, and not be hosted on another app distribution platform. The /terms page displays these Terms directly rather than as a document download. Support and Terms URLs are optional; if supplied, each must open a working, relevant page that meets Meta's Content Guidelines. Verify the production URLs before submission; app listing configuration is managed separately from this website.",
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
    title: "5. Support requests and applications",
    body: [
      "When you open a support ticket or submit a career application, you confirm the information you provide is accurate. Do not include passwords or payment details in any form.",
      "Any contributor role terms will be stated with the specific opening. Submitting an application does not by itself create an employment relationship.",
      "We may decline or close a request or application at our discretion.",
    ],
  },
  {
    title: "6. Intellectual property",
    body: [
      "The site does not state who owns the OpenWorlds name, logo, or other content. Use the support form before reusing material if you are unsure.",
      "The rights and permissions applicable to content submitted through this site have not been established in this draft. Avoid submitting material you do not wish the site operator to receive.",
    ],
  },
  {
    title: "7. Third-party links",
    body: [
      "The site links to third-party services, including Discord and YouTube. Review each provider's own terms and privacy information before using it. Any future Quest app may also use services operated by Meta or other providers; those services will be identified in the app-specific disclosures where applicable.",
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
      "We may update these Terms as the website or services change. If a Terms URL is entered in a Meta Horizon Store listing, keep it pointed directly to the current page. This draft does not establish when revisions take effect; review the current version and obtain legal advice before relying on it.",
    ],
  },
  {
    title: "11. Governing law",
    body: [
      "The applicable governing law has not been confirmed in the information available on this site. Obtain appropriate legal advice before relying on these template terms.",
    ],
  },
  {
    title: "12. Contact",
    body: ["Questions about these Terms? Use the Support page at /support, which provides a way to contact the OpenWorlds team. The site operator's legal identity and location are not specified in this draft."],
  },
  {
    title: "13. Meta Horizon Store links",
    body: [
      "For VRC.Publishing.1, the App Website URL in a Meta Horizon Store submission must open a working page relevant to OpenWorlds, without security warnings, and must not be hosted on another app distribution platform. The production website URL must be supplied and tested in Meta's listing; this website cannot configure or verify that listing.",
      "For VRC.Publishing.2, a support URL is optional. If supplied, it must open a working support page with a clear way to contact the team. The /support page provides a support ticket form; verify the live page before submitting it.",
      "For VRC.Publishing.3, a Terms URL is optional. If supplied, it should link directly to this page, where the Terms are displayed as webpage text rather than only in a downloadable document. Verify the production URL loads directly before submitting it.",
    ],
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
          <p className="mt-4 text-blue-50">Review date: October 2026 · Draft</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This is an informational draft, not legal advice or a confirmed legal agreement. It contains unresolved policy details and should be reviewed and completed before being relied on.
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
          <Link to="/privacy" className="font-medium text-[#7651c9] hover:underline">Privacy Policy</Link>
          <Link to="/support" className="font-medium text-[#7651c9] hover:underline">Support</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
