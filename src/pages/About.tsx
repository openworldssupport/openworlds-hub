import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Globe2, Share2, Heart } from "lucide-react";

export default function About() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-blue-100">About OpenWorlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-4xl">A place to make and share worlds</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            OpenWorlds is a project focused on creating, sharing, and exploring worlds. This site will share confirmed details as they become available.
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
            <p className="mt-2 text-sm leading-6 text-slate-600">Information about creation tools will be shared when they are available.</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]">
              <Share2 className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">Share</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">World sharing details have not been published yet.</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-[#987000]">
              <Heart className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">Connect</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the community links or support page to contact the project.</p>
          </article>
        </div>

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
