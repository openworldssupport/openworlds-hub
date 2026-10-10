import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { ACTIVE_PRIVACY_VERSION } from "@/lib/legalVersions";

type Section = { title: string; body: string[] };

export const privacySections: Section[] = [
  {
    title: "1. Who we are",
    body: [
      "OpenWorlds is a community project for creating, sharing, and exploring worlds. In this policy, “we”, “us”, and “OpenWorlds” refer to the team responsible for this website and the official OpenWorlds services that link to this policy.",
      "This policy is for OpenWorlds and its Meta Quest app; OpenWorlds is not affiliated with VRChat. The website and game are separate products, and the in-game data inventory must be confirmed against the actual game build, Meta platform features, SDKs, and backend before publication.",
      "This page is intended to be publicly readable without signing in. The site operator should confirm its legal identity and contact details before treating this draft as a final legal notice.",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Support tickets: the email address, selected reason, and message are required. Name, OpenWorlds username, and subject are optional. Ticket records include a reference, status, and submission/response/closure timestamps; ticket details can be read by authorized company staff and may be sent to the configured support email provider.",
      "Career applications: when a role accepts applications, we collect name, email, role, written answers, availability, and any optional portfolio or LinkedIn link supplied. Applications are stored for team review and sent to the configured careers email provider.",
      "Company accounts: invited or approved staff accounts store email, verification time, role/access assignment, and optional staff profile fields such as name, nickname, department, position, badge, and image when provided. One-time sign-in codes are sent to the account email address; session/authentication records are handled by the authentication service.",
      "Staff features: staff messages and announcements store the author account, displayed staff details, message or announcement content, timestamps, and any uploaded image/video and its metadata. Uploaded media is stored using the site's configured file storage.",
      "Policy acceptance: when you agree to an updated policy while signed in, we store your account ID, the Privacy Policy and Terms versions accepted, and the acceptance timestamp. If you are signed out, your browser stores a version-specific acceptance marker in local storage; it is not linked to a named account by this site.",
      "Website infrastructure: Convex and the hosting/authentication providers process information needed to serve the site, database, sign-in, and file storage. Email delivery may use the configured Vly or Resend integration. Those providers may process technical connection and delivery metadata under their own terms. This codebase does not include an analytics or in-game telemetry integration; deployment/provider logs and the actual game build still need separate verification.",
      "In-game / Meta Quest data: this website repository contains no game client or game telemetry implementation, so it cannot establish what the Meta Quest game collects. We do not claim that the website inventory above covers in-game account identifiers, gameplay events, voice/chat, device data, crash reports, or any Meta platform data. The game team must inventory the shipped game, every SDK and Meta API, backend services, and sharing flows, then replace this notice with the verified categories, purposes, recipients, retention, and controls before app release.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To reply to your support request and resolve the issue you reported.",
      "To review and respond to voluntary contributor applications.",
      "To manage company accounts and respond to website requests.",
      "To operate and secure the website, authenticate approved staff, manage staff communications and announcements, store uploaded media, respond to support requests, and review contributor applications. Game-specific purposes cannot be confirmed from this website codebase and must be documented from the actual app and its SDKs before release.",
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
      "Website records are available to authorized OpenWorlds staff and relevant providers: Convex provides the app database/authentication/storage, and the configured Vly or Resend integration may deliver support and career notification emails. The exact provider configuration should be checked against the live deployment.",
      "Meta and any other game provider may separately process data when you use the Quest app. This draft does not describe or verify those game data flows; the app-specific inventory must identify them before release. Do not submit passwords or payment details through website forms.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "The current site implementation does not define fixed retention periods for support tickets, career applications, account records, staff posts, uploaded assets, policy acceptance records, or provider logs. Authorized staff can remove tickets, applications, and announcement uploads through the site tools. Ask through Support about access or deletion; provider backups and records held by Meta may follow separate retention rules. The game team's retention periods are not available in this repository and must be added after verification.",
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
      "You may use the support form to ask what personal information we hold, request correction, or request deletion. Include enough information for us to locate the relevant ticket, application, or company account, but do not send passwords or identity documents unless we specifically explain a secure method.",
      "We may need to verify your identity before acting and may retain information where required for security, legal, or operational reasons. This website cannot delete information held separately by Meta or another platform; use that provider's privacy tools for its records.",
      "Applicable rights and response requirements depend on the laws and jurisdiction governing the site's operator. The operator's legal identity and location are not specified in this draft.",
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
      "The site uses authentication/session mechanisms for company sign-in. Signed-out visitors who accept this version of the policies have a version-specific marker stored in browser local storage. The codebase has no analytics integration; other cookie or local-storage use depends on deployed platform/provider configuration and should be verified.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy as the website, game, SDKs, or data practices change. Its version is shown above. Signed-in website users are asked to review and accept the current Privacy Policy and Terms again when either policy version changes. To trigger that notice after a future change, the site operator must update the corresponding version in the site's legal version configuration and publish the revised text here.",
    ],
  },
  {
    title: "12. Contact and privacy requests",
    body: ["For questions about this policy, or to request access, correction, or deletion of information held by OpenWorlds, use the Support page and identify the email address or ticket reference associated with your request. Do not send passwords or unnecessary sensitive information. You can read this policy without signing in."],
  },
  {
    title: "13. Meta Quest app notice",
    body: ["For VRC.Quest.Privacy.1, the Meta Horizon Store Privacy Policy URL must point directly to a live, publicly readable privacy statement managed by the app team, served over HTTPS, and must not redirect to a home page or require sign-in or a download. The intended route for this site is /privacy; configure its full production HTTPS URL in the app listing and verify it from a signed-out browser before submission. This code cannot verify the live URL, TLS certificate, redirects, or Meta listing settings. This criterion checks the policy URL; it does not replace accurate app-specific data disclosures."],
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
          <p className="mt-4 text-blue-50">Version {ACTIVE_PRIVACY_VERSION} · Draft for review</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This privacy notice includes verified website collection points visible in this repository. It is not a complete Meta Quest game data inventory: the game build, SDKs, backend, Meta integrations, operator identity, and deployment provider settings still require confirmation before this becomes the app's final notice.
        </p>

        <div className="mt-8 space-y-8">
          {privacySections.map((section) => (
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
