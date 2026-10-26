import { useQuery } from "convex/react";
import { Link } from "react-router";
import { ArrowRight, BadgeCheck, ExternalLink, Film, Gamepad2, Sparkles, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";
import { CareerEnquiryDialog } from "@/components/CareerEnquiryDialog";

const programBenefits = [
  { icon: BadgeCheck, title: "Official recognition", description: "Approved members receive the Verified OpenWorlds Creator badge and a listing on our public creator directory." },
  { icon: Film, title: "Make your kind of content", description: "Videos, streams, tutorials, builds, art, and thoughtful community stories are all welcome." },
  { icon: Users, title: "Reach the community", description: "Help players discover the project and find creators who share their interests." },
];

export default function Creators() {
  const creators = useQuery(api.users.publicOfficialCreators);
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="ow-page-hero px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-blue-100"><Sparkles className="size-4" /> OpenWorlds Creator Program</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Create worlds of your own.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">Make videos, streams, guides, artwork, and stories inspired by OpenWorlds. Meet the creators officially recognized by our team and find out how to apply.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CareerEnquiryDialog label="Apply to the program" mode="creator-application" />
              <a href="#creators" className="inline-flex h-11 items-center gap-2 rounded-sm border border-white/40 px-5 text-sm font-semibold text-white hover:bg-white/10">Meet the creators <ArrowRight className="size-4" /></a>
            </div>
          </div>
          <div className="hidden size-36 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:flex"><Gamepad2 className="size-16" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="max-w-2xl"><p className="text-sm font-medium text-[#176b45]">The program</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">A place for the people who make OpenWorlds theirs.</h2><p className="mt-3 text-sm leading-7 text-slate-600">The Official OpenWorlds Creator Program recognizes community members who make original content about the project. We review every application. An application is not an approval, and only creators added by an administrator receive the verified badge.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">{programBenefits.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-lg border border-slate-200 bg-white p-6"><span className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-[#176b45]"><Icon className="size-5" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
      </section>

      <section id="creators" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#176b45]">Verified community</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Official OpenWorlds Creators</h2><p className="mt-2 text-sm leading-6 text-slate-600">Every creator shown here has been approved by the OpenWorlds team.</p></div>{creators && creators.length > 0 && <span className="text-sm text-slate-500">{creators.length} approved {creators.length === 1 ? "creator" : "creators"}</span>}</div>
          {creators === undefined ? <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading the official creator roster…</p> : creators.length === 0 ? <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center"><BadgeCheck className="mx-auto size-8 text-slate-400" /><h3 className="mt-3 font-semibold">Creator roster coming soon</h3><p className="mt-2 text-sm text-slate-600">When the team approves creators, their public profiles will appear here.</p></div> : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{creators.map((creator) => <article key={creator.username} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center gap-4">{creator.image ? <img src={creator.image} alt="" loading="lazy" className="size-14 rounded-full border border-slate-200 object-cover" /> : <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-[#176b45]">{creator.displayName.slice(0, 1).toUpperCase()}</span>}<div className="min-w-0"><h3 className="truncate font-semibold">{creator.displayName}</h3><p className="truncate text-sm text-slate-500">@{creator.username}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"><BadgeCheck className="size-4" /> Verified creator</span>{creator.socialUrl && <a href={creator.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#176b45] hover:underline">{creator.socialPlatform || "Social profile"}<ExternalLink className="size-3.5" /></a>}</div></article>)}</div>
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-16"><div><h2 className="text-2xl font-semibold tracking-tight">Ready to share what you make?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Send an application with your OpenWorlds username, contact email, content experience, and social links. Applications go to Careers for review; no automatic approval or fake account link is created.</p><Link to="/careers" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#176b45] hover:underline">Explore all Careers opportunities <ArrowRight className="size-4" /></Link></div><CareerEnquiryDialog label="Apply as a creator" mode="creator-application" /></section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. Creator applications are reviewed by the team.</footer>
    </main>
  );
}
