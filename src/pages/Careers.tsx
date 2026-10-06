import { SiteNav } from "@/components/SiteNav";
import { careerRoles, type CareerRole, type CareerBranch } from "@/lib/careers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import { Link } from "react-router";

type ListedRole = CareerRole & { branch: CareerBranch };

const openRoles: ListedRole[] = careerRoles.filter((role) => role.status !== "Filled");
const filledRoles: ListedRole[] = careerRoles.filter((role) => role.status === "Filled");

const statusLabels: Record<string, string> = {
  Open: "Open",
  Limited: "Limited",
  Waitlist: "Waitlist",
};

const hiringSteps = [
  {
    step: "01",
    title: "Find the right fit",
    text: "Read the full role details and apply only where your interests and availability genuinely match.",
  },
  {
    step: "02",
    title: "Send an application",
    text: "The form asks about your background, how you would approach the role, and how much time you can offer.",
  },
  {
    step: "03",
    title: "Private review",
    text: "Every application is reviewed privately by the company team. Nothing you send is shown publicly.",
  },
  {
    step: "04",
    title: "Conversation & decision",
    text: "Shortlisted applicants are contacted by email for a short conversation, and we follow up either way.",
  },
];

const workingStyle = [
  {
    icon: MapPin,
    title: "Remote & flexible",
    text: "Contributors work from wherever they are, on a schedule that fits around their week.",
  },
  {
    icon: Users,
    title: "Small team, real ownership",
    text: "OpenWorlds is built by a compact group of contributors, so every role comes with genuine responsibility.",
  },
  {
    icon: CheckCircle2,
    title: "Written & transparent",
    text: "Decisions and updates are written down, so everyone can follow along without sitting in meetings.",
  },
];

const faqs: Array<[string, string]> = [
  [
    "Are these paid positions?",
    "No. Every OpenWorlds contributor role is voluntary and unpaid. Please apply only if that arrangement works for you.",
  ],
  [
    "Where is the team based?",
    "OpenWorlds is a distributed project. Contributors work remotely on flexible schedules, so you can take part from any time zone.",
  ],
  [
    "What happens after I apply?",
    "Your application is saved for private review by the company team and is never shown publicly. If the team would like to talk, they will contact you by email.",
  ],
  [
    "What should I put in my application?",
    "The form asks about relevant skills and projects, how you would approach the role, and your availability. Honest, concrete answers are more useful than polished ones.",
  ],
  [
    "Can I ask a question before applying?",
    "Yes. Email careers@openworlds.dk and the team will help with anything that is unclear.",
  ],
];

function RoleCard({ role }: { role: ListedRole }) {
  const accepting = role.status !== "Filled";

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#7651c9]">{role.department}</p>
          <h3 className="mt-1 text-lg font-semibold">{role.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            accepting ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {accepting ? (statusLabels[role.status] ?? role.status) : "Filled"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{role.summary}</p>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <h4 className="font-semibold">You’ll contribute</h4>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            {role.responsibilities.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#0066cc]">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Good fit if you</h4>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            {role.qualifications.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#7651c9]">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 className="size-3.5" /> Flexible, remote contribution
        </span>
        {accepting ? (
          <Link
            to={`/careers/role/${role.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066cc] hover:underline"
          >
            Role details &amp; apply <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span className="text-sm font-medium text-slate-500">Not accepting applications</span>
        )}
      </div>
    </article>
  );
}

export default function Careers() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">OpenWorlds · Careers</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Build worlds with us.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            OpenWorlds is built by a small, distributed team of volunteers. Every contributor role is
            remote, flexible, and unpaid — and when a role opens, it is listed here first.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#roles"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0052a3] hover:bg-blue-50"
            >
              View open roles <ArrowRight className="size-4" />
            </a>
            <a
              href="#hiring"
              className="inline-flex h-11 items-center rounded-lg border border-white/50 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              How we hire
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <BriefcaseBusiness className="size-5 text-[#0066cc]" />
            <p className="mt-3 text-2xl font-semibold">{openRoles.length}</p>
            <p className="text-sm text-slate-500">roles accepting applications</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <HeartHandshake className="size-5 text-[#7651c9]" />
            <p className="mt-3 text-sm font-semibold">Volunteer contributor roles</p>
            <p className="mt-1 text-sm text-slate-500">All listed roles are unpaid</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <MapPin className="size-5 text-[#987000]" />
            <p className="mt-3 text-sm font-semibold">Remote &amp; flexible</p>
            <p className="mt-1 text-sm text-slate-500">Contribute from anywhere, on your schedule</p>
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-5xl scroll-mt-24 px-5 pb-10 sm:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#7651c9]">Current openings</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Open roles</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Only confirmed openings are listed here. Titles are published once the team has verified
            the role details.
          </p>
        </div>

        {openRoles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-10">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#0066cc] shadow-sm">
              <BriefcaseBusiness className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">No open roles right now</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              There are no contributor openings at the moment. New roles are announced on the News
              page and listed here first — or email us to introduce yourself ahead of time.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/news"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]"
              >
                News &amp; announcements <ArrowRight className="size-4" />
              </Link>
              <a
                href="mailto:careers@openworlds.dk"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Mail className="size-4" /> careers@openworlds.dk
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openRoles.map((role) => (
              <RoleCard key={role.slug} role={role} />
            ))}
          </div>
        )}
      </section>

      {filledRoles.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 pb-12 sm:px-8">
          <div className="mb-5">
            <p className="text-sm font-medium text-[#7651c9]">Recently filled</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Closed positions</h2>
          </div>
          <div className="space-y-3">
            {filledRoles.map((role) => (
              <div
                key={role.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
              >
                <div>
                  <h3 className="font-semibold">{role.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {role.department} · {role.summary}
                  </p>
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Filled
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="hiring" className="scroll-mt-24 border-y border-slate-100 bg-slate-50 px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#7651c9]">What to expect</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How we hire</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Applying takes a little care, and we treat every application the same careful way.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hiringSteps.map(({ step, title, text }) => (
              <article key={step} className="rounded-xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-5">
                <p className="text-sm font-semibold text-[#0066cc]">{step}</p>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#7651c9]">Working with OpenWorlds</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How we work</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {workingStyle.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#7651c9]">Good to know</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 sm:px-6">
            <Accordion type="single" collapsible>
              {faqs.map(([question, answer]) => (
                <AccordionItem key={question} value={question}>
                  <AccordionTrigger>{question}</AccordionTrigger>
                  <AccordionContent className="leading-6 text-slate-600">{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <aside className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <HeartHandshake className="mt-0.5 size-5 shrink-0" />
            <p>
              <strong>Volunteer roles:</strong> These contributor roles are voluntary and unpaid.
              Please apply only if that arrangement works for you. Questions?{" "}
              <a href="mailto:careers@openworlds.dk" className="font-semibold underline">
                careers@openworlds.dk
              </a>
            </p>
          </aside>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Don’t see your role?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Introduce yourself by email and we’ll keep you in mind when new contributor roles open.
              </p>
            </div>
            <a
              href="mailto:careers@openworlds.dk"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]"
            >
              <Mail className="size-4" /> Get in touch
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All contributor roles are voluntary and unpaid.
      </footer>
    </main>
  );
}
