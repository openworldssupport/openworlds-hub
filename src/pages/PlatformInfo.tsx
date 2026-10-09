import { SiteNav } from "@/components/SiteNav";
import { ArrowRight, BookOpen, BriefcaseBusiness, Mail, Users } from "lucide-react";
import { Link } from "react-router";

const pages = {
  about: {
    eyebrow: "About Open Worlds",
    title: "A place to make and share worlds",
    description: "Open Worlds is a place where people can make and share their own worlds.",
    icon: BookOpen,
    sections: [
      { title: "Create", text: "Bring your ideas to life in Open Worlds." },
      { title: "Explore", text: "Explore worlds made by the OpenWorlds community." },
      { title: "Share", text: "Share what you make and invite others to join in." },
    ],
  },
  community: {
    eyebrow: "Community",
    title: "Make something together",
    description: "Open Worlds is for people who enjoy making, sharing, and exploring worlds together.",
    icon: Users,
    sections: [
      { title: "Be respectful", text: "Treat other players and creators with respect. Harassment and hateful behavior are not welcome." },
      { title: "Share responsibly", text: "Only post content you have permission to share, and keep community spaces welcoming." },
      { title: "Official channels", text: "Official community links will be added here when they are ready. We do not list unverified invites." },
    ],
  },
  careers: {
    eyebrow: "Careers",
    title: "Help build Open Worlds",
    description: "We are glad you are interested in working with us. There are no confirmed openings listed right now.",
    icon: BriefcaseBusiness,
    sections: [
      { title: "Current openings", text: "No open roles have been published yet. Please check back for updates." },
      { title: "Contributions", text: "If you have an idea for contributing, contact the team when an official contact channel is available." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    description: "For support or other questions, use the contact methods listed on this website.",
    icon: Mail,
    sections: [
      { title: "Support contact", text: "Use the support form on this site and we’ll reply by email." },
      { title: "Company sign-in", text: "Company accounts are invitation-only and use a one-time email code. Public player sign-up is closed." },
    ],
  },
} as const;

type PlatformInfoPageProps = {
  /** Which content block to show. Defaults to About so the page can never render blank. */
  page?: keyof typeof pages;
};

export default function PlatformInfoPage({ page = "about" }: PlatformInfoPageProps) {
  const content = pages[page] ?? pages.about;
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-amber-200"><Icon className="size-5" /></div>
          <p className="mt-6 text-sm font-medium text-blue-100">{content.eyebrow}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">{content.description}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] p-5">
              <h2 className="font-medium">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </article>
          ))}
        </div>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#7651c9] hover:underline">Back to home <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  );
}
