import { Link, useParams } from "react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, BadgeCheck, Loader2, UserRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";

export default function PlayerProfile() {
  const { username = "" } = useParams();
  const profile = useQuery(api.users.publicPlayerProfile, { username });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/worlds" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#176b45]"><ArrowLeft className="size-4" /> Back to discovery</Link>
        {profile === undefined ? (
          <div role="status" className="mt-6 flex items-center gap-3 rounded border border-slate-200 bg-white p-5 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" /> Loading profile…</div>
        ) : profile === null ? (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">This profile isn’t available for public discovery.</p>
          </section>
        ) : (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-4">
              {profile.image ? <img src={profile.image} alt="" className="size-16 rounded-full border border-slate-200 object-cover" /> : <span className="flex size-16 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500"><UserRound className="size-7" /></span>}
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">{profile.displayName || profile.username}{profile.isOfficialCreator && <BadgeCheck className="size-5 shrink-0 text-sky-600" aria-label="Official Content Creator" />}</h1>
                <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
              </div>
            </div>
            <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">Public profile information shared by this player.</p>
          </section>
        )}
      </section>
    </main>
  );
}
