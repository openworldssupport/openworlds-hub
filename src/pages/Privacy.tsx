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
      "Player accounts and sign-in: player account records can include a player username/login, display name, email address, account role, and any optional recovery email (also available on company accounts). A recovery email only becomes active after a code sent to that address is verified. Password credentials are processed by the server-side authentication service; passwords are not returned to the website interface or administrators as plain text. Authentication/session records are handled by the authentication service. If enabled, two-step verification data includes an authenticator secret, verification counters/attempts, and hashes of recovery codes; administrators are not shown these values through the website interface. Each active sign-in session also records a per-browser identifier, browser/operating-system label, device type, and created/last-active times so the account can list signed-in devices and email a new-device alert to a verified address. This feature does not store an IP-based location. An optional phone number can be added and verified by a six-digit SMS code; once verified it can be used as a backup second factor when an authenticator app is unavailable. SMS delivery is handled by Vonage Verify. Settings show a masked form of the number; ordinary staff and administrator lists do not receive it, and the full number is available only in an owner-only investigation export.",
      "Company accounts: invited or approved staff accounts store email, verification time, role/access assignment, and optional profile fields such as name, nickname, department, position, badge, and volunteer recognition status. Staff accounts use the same sign-in page; company accounts use one-time email codes there, and sensitive staff actions require a code from the staff member's own authenticator app. Access invitations record the invited email, assignment, inviter, and invitation time.",
      "Account security and moderation: the site may store recovery-email verification state, two-step verification state, failed verification counts/times, account restriction status/reason/time, and appeals (including the account email, appeal message, status, and review timestamps/reviewer). Reports may include evidence links, and the site stores moderation assessments, warning records, and audit entries showing the reports, evidence counts, severity, score, and action. Above strict corroboration thresholds, the system may issue a warning or a short temporary restriction automatically; permanent bans are never automatic. These records are used to secure accounts, review restrictions, and handle appeals. Moderation reports, warnings, restrictions, appeals, audit history, and IP/CIDR network blocks are visible only to the capabilities granted to an exact department and position. Administrators can review and change those grants; default moderation roles exist in Executive Leadership, Community Operations & Player Engagement, and Faction. The Support Escalations Coordinator default can view reports and bans but not appeals. Permanent bans require ban permission, and staff-account cases require an administrator. IP/CIDR blocks are stored for edge or game-server enforcement; the website runtime does not receive a visitor's IP address, and the blocklist export requires a separate server secret.",
      "Automatic image safety: profile photos are screened by a configured third-party image-moderation provider before they are saved. A flagged image is refused automatically and held in a private quarantine while the site stores a moderation case with the account identifier, reason, provider scores, action taken, a temporary upload pause, and timestamps, and emails a summary to the contact team. A person then reviews it and either approves and restores the image or keeps the block and deletes it. Images only become the account's public profile photo after passing the check or being approved on review.",
      "Presence and online status: the website records a last-activity timestamp while a signed-in browser tab is open, and a game-activity timestamp when the game client reports a session. These timestamps power the online/in-game status shown on public player profiles and are not used for advertising. Exact timestamps are not shown publicly beyond a relative last-seen label.",
      "Player profile and saved game data: player and company accounts can store a public username (if chosen), display name or nickname, optional bio, optional profile photo, and whether the friends list is public. These public profile fields are searchable by other signed-in and signed-out visitors; accounts without a username can still be found by display name. Sign-in email addresses are never displayed in search or on profiles. Friend requests store the sender, receiver, status, and timestamps, and are visible only to the two accounts involved. A player can pause new friend requests without hiding their profile. The website's player-data endpoints scope access to the authenticated player's own save; the reviewed website admin interfaces do not expose game-save contents.",
      "Staff features: staff messages and announcements store the author account, displayed staff details, message or announcement content, timestamps, and any uploaded image/video and its metadata. Drafts are staff-only; published announcements and attached media are public. Uploaded media is stored using the site's configured file storage.",
      "Admin notification settings: administrators can save recipient email addresses and choose careers, support, or both. These addresses are stored in the website database and shown to administrators in masked form. The app does not require the admin to verify that a recipient controls the address; admins should add only addresses authorized to receive these generic alerts. Removing an address stops future matching alerts.",
      "Historical policy acceptance: records created by the former policy-acceptance prompt may include an account ID, the Privacy Policy and Terms versions accepted, and the acceptance timestamp. The prompt has been removed; policy pages remain available to read, and no acceptance is required to browse the site.",
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
      "To manage company accounts, deliver selected generic submission alerts, prevent repeated submissions using a hashed email and timestamp, secure accounts, show signed-in devices, email new-device alerts to verified addresses, handle moderation appeals, and respond to website requests.",
      "To operate and secure the website and game, provide account and multiplayer features, enable voice chat, respond to support requests and careers enquiries, and manage staff communications and announcements.",
      "The game client is designed to use account, session, and player-presence information to support online multiplayer. We have not verified the complete deployed backend’s collection and retention practices for those events.",
    ],
  },
  {
    title: "4. Legal bases (where applicable)",
    body: [
      "The operator's legal identity, establishment/location, and applicable jurisdictions have not been supplied to the site. The operator must identify the applicable legal basis for each purpose (including support, careers, account security, moderation, and optional recovery features) and any required consent/notice before publishing this policy. For a legal disclosure to Danish police, the prosecution service, a court, or another competent authority, we assess the GDPR and the Danish Data Protection Act, including GDPR Article 6(1)(c) or (f), Article 9(2)(f), and section 8 of the Danish Data Protection Act for criminal-offence data. A court order is not required for every Danish police request; where a court order or other coercive measure is legally required, we require it. A form checkbox records the action shown in that form; it does not by itself establish that consent is the correct legal basis for every related processing activity. This draft is not a legal determination and must be completed for the actual operator and users' jurisdictions.",
    ],
  },
  {
    title: "5. Sharing",
    body: [
      "Legal requests only under Danish law: we do not open or export unmasked private account records for internal review, curiosity, or convenience. Normal support and safety work uses limited or masked information. A complete account record is opened only when we receive a valid request from Danish police, the prosecution service, a court, or another competent authority that we assess as legally entitled to it. We assess the basis under the GDPR and the Danish Data Protection Act (Databeskyttelsesloven), including GDPR Article 6(1)(c) or (f), Article 9(2)(f), and section 8 of the Danish Data Protection Act where the data concerns criminal offences. Danish law does not require a court order for every police request; where a court order or other coercive measure is legally required, we require it. The owner account must unlock with its authenticator, record the requesting authority, case/order reference, jurisdiction, Danish/EU legal basis, and reason, and confirm that the disclosure is limited to what the request legally requires. Every opening is logged. Authentication secrets, two-step secrets, and recovery-code hashes are excluded. The full export can include unmasked contact details and stored account content; it is not available through ordinary staff or administrator lists, and the owner must store it securely and delete it when no longer needed.",
      "Support ticket content is stored in the website database and sent to the support inbox. The server-side ticket-detail query is restricted to administrators; the supplied site interface currently does not display an admin ticket list, while a limited status lookup is available to someone who supplies the matching ticket reference and email. Careers submissions are emailed to the Careers inbox, while the website stores only a hashed email and latest submission timestamp for rate limiting. Configured alert addresses receive only a generic ready-for-review notice. Staff and administrators unlock sensitive staff tools for 15 minutes per session by confirming a code from the authenticator app linked to their own account; that unlock covers the staff account directory (including masked account email addresses, names/nicknames, account/staff roles, assignments, and website-restriction status) plus staff/admin access changes, notification-recipient changes, creator approvals, announcement publishing, moderation actions, and the administrator-only website status switch. No emailed code is sent to the Support or Careers inbox for these actions, and no authenticator secret or recovery code is ever shown to another staff member; moderation information (including restriction names, masked email addresses, reasons, appeal messages, and IP/CIDR block entries) is visible only to staff with the matching moderation capability, not to every staff member or only to administrators. The dedicated Trust & Safety console records permissions changes and enforcement decisions in the audit log. Staff accounts with permission can access staff messages and announcement drafts; published announcements and attached media are public. The reviewed website interfaces do not expose password credentials, one-time codes, two-step secrets, recovery-code hashes, or private player saves. Service providers may process relevant data to host the site, authenticate users, store files, deliver email, and deliver SMS verification codes through Vonage Verify when phone verification is used. The complete deployed game's actual processing and retention have not been verified. Do not submit passwords or payment details through website forms.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      "Investigation-access records are retained as an accountability log; this project does not define an automatic deletion period for them. Full investigation exports are not stored by the website as a separate record and must be handled under the operator's legal-request and evidence-retention procedures.",
      "Support tickets have no automatic deletion period visible in the reviewed website code; administrators can delete ticket records using the server-side admin operation. Careers email submissions are not stored as website application records, but the Careers inbox/email provider retains messages under its own settings; the website's hashed-email rate-limit record has no scheduled cleanup visible in the reviewed code. Account, security, appeal, policy-acceptance, and staff records remain until removed under operator procedures; this project does not define a complete retention schedule or provide a general self-service account deletion flow. Announcement media can be deleted when removed from a post. Email, hosting, authentication, storage, and database providers may have their own retention periods. The deployed game backend's retention periods for account, session, presence, voice-connection, and diagnostic data have not been confirmed. The operator should establish and disclose retention periods, including backup/deletion handling, before relying on this policy. Contact Support to ask about access, correction, or deletion.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "The website uses server-side role checks and additional email-code checks for sensitive admin-console operations. A verified phone number can receive a one-time SMS code as a backup second factor for sign-in; it does not replace the authenticator app or recovery codes, and removing it requires an authenticator or recovery code when two-step verification is enabled. Passwords are processed using the server-side authentication provider and are not exposed as plain text in the website interface. These controls do not guarantee security, and no independent security audit is documented. Email recipients and infrastructure providers may process data needed to deliver messages and operate the service.",
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
      "Authentication uses browser session mechanisms managed by the authentication provider. The reviewed app code does not include a product-analytics SDK. If runtime monitoring is enabled in deployment, generic error reports are sent to the configured monitoring endpoint with the site origin/path and app identifier. Hosting and security providers may also use essential technical storage or logs; their exact settings must be checked for the deployed site.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy as the website, game, or information practices change. Its version is shown above. The current version remains available here to read whenever it changes.",
    ],
  },
  {
    title: "12. Contact and privacy requests",
    body: [
      "For questions about this policy, or to request access, correction, or deletion of information held by OpenWorlds, use the Support page and identify the email address or ticket reference associated with your request. You may also contact careers@openworlds.dk about a careers submission. Do not send passwords or unnecessary sensitive information. You can read this policy without signing in.",
      "Law-enforcement or legal requests for account records must be sent to contact@openworlds.dk and include the requesting authority, case or order reference, jurisdiction, the Danish/EU legal basis relied on, and the specific records sought. We review the validity and scope of the request before disclosing anything. Where Danish law requires a court order or other coercive measure, we require that order or measure.",
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
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-900">
          We will never access private information — meaning unmasked personal data in a full account record — unless we are legally required to do so. We assess requests under the GDPR and the Danish Data Protection Act. Our internal rule is stricter than Danish law requires: normal support and safety work uses limited or masked information, full records are opened only for a valid law-enforcement or court/legal request, and every disclosure is logged.
        </p>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
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
