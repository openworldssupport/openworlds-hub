import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Globe2, Share2, Heart, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleBadge } from "@/components/RoleBadge";

/**
 * Public team list: shows each assigned team member with their "Staff" or
 * "Dev" badge. Hidden until admins have assigned at least one position.
 */
function TeamSection() {
  const team = useQuery(api.staff.publicTeam);

  if (!team || team.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-white text-[#7651c9] shadow-sm">
          <Users className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">The people behind OpenWorlds</h2>
          <p className="text-sm text-slate-500">Company staff and the development team keeping the worlds running.</p>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member, index) => (
          <li
            key={`${member.name}-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f7fb] text-sm font-semibold text-slate-600">
                {member.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]!.toUpperCase())
                  .join("") || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{member.name}</p>
                <p className="text-xs text-slate-400">OpenWorlds team</p>
              </div>
            </div>
            <RoleBadge badge={member.badge} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function About() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-blue-100">About OpenWorlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-4xl">A place to make and share worlds</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            OpenWorlds is a community for creating, sharing, and exploring worlds together. It started as a space for players to build things together and has grown into a place where creators, coders, artists, and dreamers come together.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
              <Globe2 className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">Create</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Bring your ideas to life in Open Worlds. Whether you are making small tweaks, building whole worlds, or designing new experiences, there is always something to explore and create.</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]">
              <Share2 className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">Share</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Show what you make, invite others in, and help shape the spaces that people spend time in. OpenWorlds rewards curiosity, collaboration, and playful experimentation.</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]">
              <Heart className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">Connect</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Meet the people behind the worlds, share feedback, and help keep the community welcoming, safe, and creative.</p>
          </article>
        </div>

        <TeamSection />

        <div className="mt-10 text-center">
          <Link
            to="/support"
            className="inline-flex h-11 items-center rounded-lg bg-[#0066cc] px-6 text-sm font-medium text-white hover:bg-[#004a99]"
          >
            Contact the OpenWorlds team
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
