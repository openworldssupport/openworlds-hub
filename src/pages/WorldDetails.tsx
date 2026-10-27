import { Link, useParams } from "react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { SiteNav } from "@/components/SiteNav";
import type { Id } from "@/convex/_generated/dataModel";

export default function WorldDetails() {
  const { worldId } = useParams();
  const world = useQuery(
    api.gameData.publishedWorldDetails,
    worldId ? { worldId: worldId as Id<"publishedWorlds"> } : "skip",
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/worlds" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#176b45]"><ArrowLeft className="size-4" /> Back to discovery</Link>
        {world === undefined ? (
          <div role="status" className="mt-6 flex items-center gap-3 rounded border border-slate-200 bg-white p-5 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" /> Loading world…</div>
        ) : world === null ? (
          <section className="mt-6 rounded border border-slate-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">World unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">This world could not be found or is no longer available.</p>
          </section>
        ) : (
          <article className="mt-6 overflow-hidden rounded border border-slate-200 bg-white">
            {world.images.length > 0 ? <div className="grid gap-1 sm:grid-cols-2">{world.images.map((image, index) => <img key={image} src={image} alt={`${world.title} picture ${index + 1}`} className="max-h-[28rem] min-h-48 w-full bg-slate-100 object-cover" />)}</div> : <div className="flex min-h-36 items-center justify-center bg-[#e8f3ec] text-[#176b45]"><Compass className="size-10" /></div>}
            <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold tracking-tight">{world.title}</h1>
            {world.description ? <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-700">{world.description}</p> : <p className="mt-4 text-sm text-slate-500">No description was provided.</p>}
            <div className="mt-7 border-t border-slate-100 pt-4 text-sm text-slate-500">
              {world.ownerUsername ? <p>Published by <Link to={`/players/${encodeURIComponent(world.ownerUsername)}`} className="font-medium text-[#176b45] hover:underline">@{world.ownerUsername}</Link></p> : <p>Publisher name is hidden by their profile settings.</p>}
              <p className="mt-1">Published {new Date(world.createdAt).toLocaleDateString()}</p>
            </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
