import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Scale } from "lucide-react";
import { ACTIVE_TERMS_VERSION } from "@/lib/legalVersions";

type Section = { title: string; body: string[] };

export const termsSections: Section[] = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "These Terms describe use of the OpenWorlds website and, once the OpenWorlds Meta Quest game is released, its related services. They are not VRChat terms. The site operator should confirm its legal identity, jurisdiction, and final adoption of these Terms before treating them as a binding agreement.",
    ],
  },
  {
    title: "2. The service",
    body: [
      "OpenWorlds is a community project for creating, sharing, and exploring worlds. This website's company sign-in is invitation-only and uses a one-time email code; public player accounts and downloads are not currently available through this website. The Meta Quest game's current release status and features must be confirmed separately from this site.",
      "Use of the Meta Quest game may also be subject to Meta's platform terms and policies. These website Terms do not replace those rules or the Privacy Policy's app-specific data disclosures. The /terms page is displayed as web text; confirm the published page and any Meta Horizon Store listing URLs directly in the production environment.",
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
      "The site links to third-party services, including Discord and YouTube. Review each provider's own terms and privacy information before using it. The OpenWorlds Meta Quest game may interact with Meta platform services and other providers; the game team must identify applicable services and explain their role in the Privacy Policy before release.",
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
      "We may update these Terms as the website, game, or services change. The current version is shown above. Signed-in website users will be asked to review and accept the current versions when either these Terms or the Privacy Policy changes. To trigger a new notice, the operator must update the version in the site's legal version configuration as well as publish the revised text. Review the current version and obtain legal advice before relying on these draft Terms.",
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
          <p className="mt-4 text-blue-50">Version {ACTIVE_TERMS_VERSION} · Draft for review</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This is an informational draft, not legal advice or a confirmed legal agreement. It contains unresolved policy details and should be reviewed and completed before being relied on.
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
