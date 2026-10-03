import { SiteNav } from "@/components/SiteNav";
import { ArrowRight, BookOpen, BriefcaseBusiness, Mail, Users } from "lucide-react";
import { Link } from "react-router";

const pages = {
  about: {
    eyebrow: "About Open Worlds",
    title: "A place to make and share worlds",
    description: "Open Worlds is a user-generated content platform where people can create experiences and share them with others.",
    icon: BookOpen,
    sections: [
      { title: "Create", text: "Build your own content and bring your ideas into Open Worlds." },
      { title: "Explore", text: "Discover experiences made by the Open Worlds community." },
      { title: "Share", text: "Publish your creations and invite others to take part." },
    ],
  },
  community: {
    eyebrow: "Community",
    title: "Make something together",
    description: "Open Worlds is for people who enjoy building, sharing, and exploring user-created experiences.",
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
    description: "For support or other questions, please use an official Open Worlds contact address once one has been confirmed.",
    icon: Mail,
    sections: [
      { title: "Support email", text: "No verified support email address is configured on this website yet." },
      { title: "Account help", text: "Website login is not connected to the shared game account service yet. Do not send passwords by email." },
    ],
  },
} as const;

type PlatformInfoPageProps = {
  page: keyof typeof pages;
};

export default function PlatformInfoPage({ page }: PlatformInfoPageProps) {
  const content = pages[page];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#2870e8]"><Icon className="size-5" /></div>
        <p className="mt-6 text-sm font-medium text-[#2870e8]">{content.eyebrow}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">{content.description}</p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 p-5">
              <h2 className="font-medium">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </article>
          ))}
        </div>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#2870e8] hover:underline">Back to home <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  );
}
