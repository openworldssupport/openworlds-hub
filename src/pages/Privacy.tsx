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
      "Support tickets: the email address, selected reason, and message are required; name, OpenWorlds username, and subject are optional. The website stores the ticket message and details in its database with a reference, status, and submission/response/closure timestamps. The full ticket is also emailed to the support inbox through the configured email provider, which sends an automated acknowledgement to the supplied address. A separately configured submission-alert recipient receives only a generic new-ticket/ready-for-review notice, not the ticket content.",
      "Careers applications and questions: the form can collect a name, email, message, selected position for applications, and an optional portfolio link. The application/question itself is emailed to careers@openworlds.dk through the configured email provider and is not saved as a submission in the website database; the provider also sends a confirmation to the supplied address. To limit repeat submissions, the website database stores a SHA-256 hash of the normalized email address and the latest submission time. Configured admin alert recipients receive only a generic notice that a career application or question is ready for review, not the applicant's details or message. The Careers inbox and email provider retain the emailed submission under their own practices.",
      "Support and career forms use hidden honeypot fields for basic bot mitigation. A filled honeypot is silently ignored; the website does not save that submitted form data. Other technical access logs that hosting or service providers may create depend on their configurations.",
      "Player accounts and sign-in: player account records can include a player username/login, display name, email address, account role, and any optional recovery email. Password credentials are processed by the server-side authentication service; passwords are not returned to the website interface or administrators as plain text. Authentication/session records are handled by the authentication service. If enabled, two-step verification data includes an authenticator secret, verification counters/attempts, and hashes of recovery codes; administrators are not shown these values through the website interface.",
      "Company accounts: invited or approved staff accounts store email, verification time, role/access assignment, and optional profile fields such as name, nickname, department, position, badge, and volunteer recognition status. Company sign-in uses one-time email codes. Access invitations record the invited email, assignment, inviter, and invitation time.",
      "Account security and moderation: the site may store recovery-email verification state, two-step verification state, failed verification counts/times, account restriction status/reason/time, and appeals (including the account email, appeal message, status, and review timestamps/reviewer). These records are used to secure accounts, review restrictions, and handle appeals.",
      "Player profile and saved game data: a player can update their display name and save game state. The website's player-data endpoints scope access to the authenticated player's own save; the reviewed website admin interfaces do not expose game-save contents.",
      "Staff features: staff messages and announcements store the author account, displayed staff details, message or announcement content, timestamps, and any uploaded image/video and its metadata. Drafts are staff-only; published announcements and attached media are public. Uploaded media is stored using the site's configured file storage.",
      "Admin notification settings: administrators can save recipient email addresses and choose careers, support, or both. These addresses are stored in the website database and visible to administrators. The app does not require the admin to verify that a recipient controls the address; admins should add only addresses authorized to receive these generic alerts. Removing an address stops future matching alerts.",
      "Policy acceptance: when you agree to updated policies while signed in, we store your account ID, the Privacy Policy and Terms versions accepted, and the acceptance timestamp. If signed out, your browser stores a version-specific acceptance marker in local storage; it is not linked to a named account by this site.",
      "Website services and diagnostics: Convex provides the website database, authentication, and file storage. Configured email services (which may include VLY, Resend, or AgentMail depending on deployment settings) process message delivery. Hosting, authentication, database, storage, and email providers may process technical connection, account, and delivery information. The app contains no product-analytics SDK; if VLY runtime monitoring is configured, generic runtime-error reports include the site origin/path and app identifier. Provider-side logs and retention are controlled by those providers.",
      "In-game account and activity information: the available game-client code is designed to send an account identifier and display name, world/session activity (including world instance, platform, and join/leave times), and player position/rotation updates while in a world. The client is designed to fetch the world's player list periodically. The complete deployed backend's receipt, storage, and retention of these events have not been independently verified.",
      "In-game voice and connection information: when voice chat is enabled, backend membership checks are used to issue short-lived Vivox access tokens; the Vivox signing key is kept on the backend. Your voice is transmitted to other players so you can communicate. This describes the client/backend design, not independently verified live processing or retention.",
      "Game-device settings: the game may store settings locally, including its backend URL, display name, and music volume. In optional anonymous-auth mode, it may also store a refresh token on that device. These local settings are distinct from information sent to the website database.",
      "Anti-cheat signals: the game client contains local hooks or checks for movement, aim, and combat values and may produce anomaly flags. The code reviewed did not show these signals being submitted to the backend; this does not establish what a deployed build or backend may collect.",
      "Discord activity: the game's Discord integration can publish game activity to Discord. The code reviewed does not indicate that Discord friend or profile data is sent to OpenWorlds.",
      "Backend verification limit: the available project does not include the complete deployed game backend. We cannot confirm from this code how deployed services store, retain, or log all game events, or whether additional server-side data is collected. This notice must be checked against the live backend before being treated as a complete account of game data practices.",
      "Information you choose to include: support, career, appeal, and staff message fields can contain personal or sensitive information you type into them. Submit only details needed for the request; never submit passwords, payment-card data, identity documents, or another person's sensitive information unless the team has provided an appropriate secure channel.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To reply to your support request and resolve the issue you reported.",
      "To publish contributor roles, send application and question messages to the Careers inbox, and send automated receipt confirmations.",
      "To manage company accounts, deliver selected generic submission alerts, prevent repeated submissions using a hashed email and timestamp, secure accounts, handle moderation appeals, and respond to website requests.",
      "To operate and secure the website and game, provide account and multiplayer features, enable voice chat, respond to support requests and careers enquiries, and manage staff communications and announcements.",
      "The game client is designed to use account, session, and player-presence information to support online multiplayer. We have not verified the complete deployed backend’s collection and retention practices for those events.",
    ],
  },
  {
    title: "4. Legal bases (where applicable)",
    body: [
      "The operator's legal identity, establishment/location, and applicable jurisdictions have not been supplied to the site. The operator must identify the applicable legal basis for each purpose (including support, careers, account security, moderation, and optional recovery features) and any required consent/notice before publishing this policy. A form checkbox records the action shown in that form; it does not by itself establish that consent is the correct legal basis for every related processing activity. This draft is not a legal determination and must be completed for the actual operator and users' jurisdictions.",
    ],
  },
  {
    title: "5. Sharing",
    body: [
      "Support ticket content is stored in the website database and sent to the support inbox. The server-side ticket-detail query is restricted to administrators; the supplied site interface currently does not display an admin ticket list, while a limited status lookup is available to someone who supplies the matching ticket reference and email. Careers submissions are emailed to the Careers inbox, while the website stores only a hashed email and latest submission timestamp for rate limiting. Configured alert addresses receive only a generic ready-for-review notice. Verified administrators who complete the additional Careers email check can view the non-anonymous account directory, including account emails, names/nicknames, account/staff roles, assignments, and website-restriction status; an additional Support email check is required for staff/admin access changes and notification-recipient changes. The account-directory email code is sent to the Careers inbox; moderation information (including restriction names, emails, reasons, and appeal messages) is visible in the staff workspace to authorized staff, not only administrators. Staff accounts with permission can access staff messages and announcement drafts; published announcements and attached media are public. The reviewed website interfaces do not expose password credentials, one-time codes, two-step secrets, recovery-code hashes, or private player saves. Service providers may process relevant data to host the site, authenticate users, store files, and deliver email. The complete deployed game's actual processing and retention have not been verified. Do not submit passwords or payment details through website forms.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "Support tickets have no automatic deletion period visible in the reviewed website code; administrators can delete ticket records using the server-side admin operation. Careers email submissions are not stored as website application records, but the Careers inbox/email provider retains messages under its own settings; the website's hashed-email rate-limit record has no scheduled cleanup visible in the reviewed code. Account, security, appeal, policy-acceptance, and staff records remain until removed under operator procedures; this project does not define a complete retention schedule or provide a general self-service account deletion flow. Announcement media can be deleted when removed from a post. Email, hosting, authentication, storage, and database providers may have their own retention periods. The deployed game backend's retention periods for account, session, presence, voice-connection, and diagnostic data have not been confirmed. The operator should establish and disclose retention periods, including backup/deletion handling, before relying on this policy. Contact Support to ask about access, correction, or deletion.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "The website uses server-side role checks and additional email-code checks for sensitive admin-console operations. Passwords are processed using the server-side authentication provider and are not exposed as plain text in the website interface. These controls do not guarantee security, and no independent security audit is documented. Email recipients and infrastructure providers may process data needed to deliver messages and operate the service.",
      "No method of transmission or storage is fully secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "You may contact Support to ask for access to personal information, request correction, or request deletion. A signed-in player can update their display name and recovery-email settings; a staff member can update their display name. There is no general self-service account deletion control in this website. Include enough information to locate a request, but do not send passwords, authenticator secrets, recovery codes, or identity documents through an ordinary support ticket. For a careers submission, contact careers@openworlds.dk or use Support to be directed to the Careers team. Rights and response deadlines depend on the law that applies to the actual operator and requester.",
      "We may need to verify your identity before acting and may retain information where required for security, legal, or operational reasons.",
      "Applicable rights and response requirements depend on the laws and jurisdiction governing the site's operator. The operator's legal identity and location are not specified in this draft.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "The project has not supplied a minimum age, parental-consent process, or procedure for handling children's data. The operator must establish an age policy and any legally required safeguards before inviting children to create accounts or submit information. Do not submit a child's personal information unless the operator has published appropriate instructions.",
    ],
  },
  {
    title: "10. Cookies and local storage",
    body: [
      "Authentication uses browser session mechanisms managed by the authentication provider. The policy-acceptance gate stores a version-specific marker in local storage for signed-out visitors; signed-in acceptance is recorded on the account. The reviewed app code does not include a product-analytics SDK. If runtime monitoring is enabled in deployment, generic error reports are sent to the configured monitoring endpoint with the site origin/path and app identifier. Hosting and security providers may also use essential technical storage or logs; their exact settings must be checked for the deployed site.",
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
    body: [
      "For questions about this policy, or to request access, correction, or deletion of information held by OpenWorlds, use the Support page and identify the email address or ticket reference associated with your request. You may also contact careers@openworlds.dk about a careers submission. Do not send passwords or unnecessary sensitive information. You can read this policy without signing in.",
    ],
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
          <p className="mt-4 text-blue-50">Version {ACTIVE_PRIVACY_VERSION} · Draft for legal and deployment review</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This is a transparency draft based on the website code reviewed, not legal advice or a guarantee of live service practices. The operator must verify live backend/provider settings and complete jurisdiction-specific details before relying on it.
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
        <p>OpenWorlds © 2026 · All rights reserved.</p>
        <p className="mt-1 text-xs">OpenWorlds is not currently a registered company.</p>
      </footer>
    </main>
  );
}
