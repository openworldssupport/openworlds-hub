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
      "This policy explains what information is collected through the OpenWorlds website and game, how it is used, and how to contact us with privacy questions.",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Support tickets: the email address, selected reason, and message are required. Name, OpenWorlds username, and subject are optional. Ticket records include a reference, status, and submission/response/closure timestamps; ticket details can be read by authorized company staff and may be sent to the configured support email provider.",
      "Careers enquiries: the website lists contributor roles but does not collect applications or store applicant details. If you email careers@openworlds.dk, your email provider and the careers team handle the message outside this website.",
      "Company accounts: invited or approved staff accounts store email, verification time, role/access assignment, and optional staff profile fields such as name, nickname, department, position, badge, and image when provided. One-time sign-in codes are sent to the account email address; session/authentication records are handled by the authentication service.",
      "Staff features: staff messages and announcements store the author account, displayed staff details, message or announcement content, timestamps, and any uploaded image/video and its metadata. Uploaded media is stored using the site's configured file storage.",
      "Policy acceptance: when you agree to an updated policy while signed in, we store your account ID, the Privacy Policy and Terms versions accepted, and the acceptance timestamp. If you are signed out, your browser stores a version-specific acceptance marker in local storage; it is not linked to a named account by this site.",
      "Website services: providers that host the website, provide sign-in, store files, or deliver emails may process technical connection, account, and delivery information needed to provide those services. The website does not use analytics.",
      "In-game information: when you use voice chat, your voice is transmitted to other players so you can communicate.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To reply to your support request and resolve the issue you reported.",
      "To publish contributor roles and respond to careers enquiries sent to the careers inbox.",
      "To manage company accounts and respond to website requests.",
      "To operate and secure the website and game, provide account and multiplayer features, enable voice chat, respond to support requests and careers enquiries, and manage staff communications and announcements.",
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
      "Website information may be processed by service providers that host the site, provide sign-in, store files, or deliver emails. Authorized OpenWorlds staff can access support requests and staff content as needed for their work. Careers messages are sent by you directly through your email provider and are handled in the careers inbox, not stored in the website database. In-game information, including voice chat, is shared as needed to provide multiplayer features and let other players communicate with you. Do not submit passwords or payment details through website forms.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "We keep website records for as long as needed to provide the service, respond to requests, and maintain security. Authorized staff can remove tickets and announcement uploads through the site tools. Careers email is retained and deleted according to the email provider and careers team's practices. In-game information is kept as long as needed to operate the game and its multiplayer features. Contact Support to ask about access or deletion.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "Access to support tickets and company tools is restricted by server-side company-account authorization checks. Careers enquiries are sent to the careers inbox and are not stored in the website database. No independent security review or comprehensive security controls are described here.",
      "No method of transmission or storage is fully secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "You may use the support form to ask what personal information we hold, request correction, or request deletion. Include enough information for us to locate the relevant ticket or company account, but do not send passwords or identity documents unless we specifically explain a secure method. For a careers email, contact the careers team directly.",
      "We may need to verify your identity before acting and may retain information where required for security, legal, or operational reasons.",
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
      "The website uses authentication and session storage for staff sign-in. Signed-out visitors who accept this version of the policies have a version-specific marker stored in browser local storage. The website does not use analytics.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy as the website, game, or information practices change. Its version is shown above. Signed-in website users are asked to review and accept the current Privacy Policy and Terms again when either policy version changes.",
    ],
  },
  {
    title: "12. Contact and privacy requests",
    body: ["For questions about this policy, or to request access, correction, or deletion of information held by OpenWorlds, use the Support page and identify the email address or ticket reference associated with your request. Do not send passwords or unnecessary sensitive information. You can read this policy without signing in."],
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
        <p>OpenWorlds © 2026 · All rights reserved.</p>
        <p className="mt-1 text-xs">OpenWorlds is not currently a registered company.</p>
      </footer>
    </main>
  );
}
