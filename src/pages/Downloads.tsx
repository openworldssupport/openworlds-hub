import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  Monitor,
} from "lucide-react";

const convexSiteUrl = (import.meta.env.VITE_CONVEX_URL || "https://blissful-lynx-171.convex.cloud")
  .replace(/\/+$/, "")
  .replace(/\.convex\.cloud$/, ".convex.site");

const release = {
  name: "Launcher 66",
  published: "November 7, 2026",
  file: "OpenWorldsLauncher.exe",
  size: "146 MB",
  downloadUrl: `${convexSiteUrl}/downloads/windows`,
};

export default function Downloads() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-blue-100">Play OpenWorlds</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Downloads</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            The official OpenWorlds Launcher for Windows is available now. Download the latest
            build and start playing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={release.downloadUrl}
              className="inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#14583c] transition hover:bg-[#eaf4ec]"
            >
              <Download className="size-4" />
              Download for Windows
            </a>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-blue-50" role="status">
            <CheckCircle2 className="size-4" />
            Windows build available
          </p>
        </div>
      </section>

      <section id="builds" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#176b45]">
              Latest release
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {release.name}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 border border-[#176b45]/25 bg-[#e8f3ec] px-3 py-1.5 text-xs font-semibold text-[#176b45]">
            <CheckCircle2 className="size-3.5" />
            Windows
          </span>
        </div>

        <div className="mt-6">
          <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ec] text-[#176b45]">
                  <Monitor className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">OpenWorlds Launcher</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The official Windows build, published by OpenWorlds Support.
                  </p>
                </div>
              </div>
              <span className="border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
                .exe
              </span>
            </div>

            <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Released</dt>
                <dd className="mt-1 font-medium">{release.published}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">File</dt>
                <dd className="mt-1 break-all font-medium">{release.file}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Size</dt>
                <dd className="mt-1 font-medium">{release.size}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={release.downloadUrl}
                className="inline-flex h-11 items-center gap-2 rounded-sm bg-[#176b45] px-5 text-sm font-medium text-white transition hover:bg-[#105337]"
              >
                <Download className="size-4" />
                Download launcher
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              to="/roadmap"
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CalendarDays className="size-6 text-[#176b45]" />
              <h3 className="mt-3 font-semibold">Watch the roadmap</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Check the roadmap for confirmed milestones.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#176b45]">
                Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              to="/news"
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CalendarDays className="size-6 text-[#a52234]" />
              <h3 className="mt-3 font-semibold">Release notes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Published updates will appear on the News page.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#a52234]">
                Read news <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              to="/support"
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Monitor className="size-6 text-[#795600]" />
              <h3 className="mt-3 font-semibold">Install help</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Have a question about the launcher? Use the support form.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#795600]">
                Get help <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · Official Windows launcher available
      </footer>
    </main>
  );
}
