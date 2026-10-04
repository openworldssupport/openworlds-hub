import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Scale } from "lucide-react";

type Section = { title: string; body: string[] };

const sections: Section[] = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "By using the OpenWorlds website, you agree to these Terms of Service. If you do not agree, please do not use the site.",
    ],
  },
  {
    title: "2. The service",
    body: [
      "OpenWorlds is a community website for creating, sharing, and exploring worlds. Some features described on the site are planned and not yet available.",
      "A public game download, paid features, or account sign-in may not exist yet. Where they are unavailable, this is stated on the relevant page.",
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
      "Roles listed on the Careers page are voluntary and unpaid contributor positions. Submitting an application does not create an employment relationship or any obligation on either side.",
      "We may decline or close a request or application at our discretion.",
    ],
  },
  {
    title: "6. Intellectual property",
    body: [
      "The OpenWorlds name, logo, and site content are owned by the OpenWorlds team or its licensors and may not be used without permission, except as allowed by law.",
      "You keep ownership of the original content you submit, but you grant us permission to use it as needed to review and respond to your request.",
    ],
  },
  {
    title: "7. Third-party links",
    body: [
      "The site links to third-party services such as Discord and YouTube. We do not control those services and are not responsible for their content or practices.",
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
      "We may update these terms as the project changes. Continued use of the site after changes means you accept the updated terms.",
    ],
  },
  {
    title: "11. Governing law",
    body: [
      "These terms are governed by the laws of Denmark, without regard to conflict-of-law rules.",
    ],
  },
  {
    title: "12. Contact",
    body: ["Questions about these terms? Email support@openworlds.dk."],
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
          <p className="mt-4 text-blue-50">Last updated: October 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          These terms are a good-faith summary of the rules for using this website. They are a template and
          not legal advice — have them reviewed before you rely on them.
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
