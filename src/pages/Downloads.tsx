import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Monitor,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const release = {
  name: "Launcher 66",
  version: "v2026.11.06.2038",
  published: "November 7, 2026",
  file: "OpenWorldsLauncher.exe",
  size: "146 MB",
  sha256: "8c3efec7ee99aaac03bf2cbc0a59e5ab36ed776d01014588c104538710445422",
  downloadUrl:
    "https://github.com/openworldssupport/openworlds-hub/releases/download/v2026.11.06.2038/OpenWorldsLauncher.exe",
  releaseUrl:
    "https://github.com/openworldssupport/openworlds-hub/releases/tag/v2026.11.06.2038",
};

const platforms = [
  {
    name: "Windows",
    detail: "Available now for Windows. Download the launcher above.",
    icon: Monitor,
    available: true,
  },
  {
    name: "macOS",
    detail: "No macOS launcher is included in this release.",
    icon: Laptop,
    available: false,
  },
  {
    name: "Linux",
    detail: "No Linux launcher is included in this release.",
    icon: Terminal,
    available: false,
  },
];

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
            build, verify its checksum, and start playing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={release.downloadUrl}
              className="inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#14583c] transition hover:bg-[#eaf4ec]"
            >
              <Download className="size-4" />
              Download for Windows
            </a>
            <a
              href={release.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-sm border border-white/50 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Release notes
              <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-blue-50" role="status">
            <CheckCircle2 className="size-4" />
            Windows build available · {release.version}
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ec] text-[#176b45]">
                  <Monitor className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">OpenWorlds Launcher</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The official Windows build, published by OpenWorlds Support on GitHub.
                  </p>
                </div>
              </div>
              <span className="border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
                .exe
              </span>
            </div>

            <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Version</dt>
                <dd className="mt-1 font-medium">{release.version}</dd>
              </div>
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
              <a
                href={release.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-sm border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View release
                <ExternalLink className="size-4" />
              </a>
            </div>
          </article>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#176b45]" />
              <h3 className="font-semibold">Verify your download</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Compare the SHA-256 checksum after downloading. It should match the value below
              exactly.
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              SHA-256
            </p>
            <code className="mt-1.5 block break-all bg-white p-3 font-mono text-xs leading-5 text-slate-700 ring-1 ring-slate-200">
              {release.sha256}
            </code>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              PowerShell
            </p>
            <code className="mt-1.5 block overflow-x-auto bg-white p-3 font-mono text-xs leading-5 text-slate-700 ring-1 ring-slate-200">
              Get-FileHash .\OpenWorldsLauncher.exe -Algorithm SHA256
            </code>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Only download the launcher from this page or the official GitHub release. Do not use
              re-uploaded copies.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Available platforms</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {platforms.map(({ name, detail, icon: Icon, available }) => (
              <article key={name} className="border-t-2 border-slate-900 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-[#176b45]" />
                    {name}
                  </h3>
                  <span
                    className={
                      available
                        ? "text-xs font-medium text-[#176b45]"
                        : "text-xs font-medium text-slate-400"
                    }
                  >
                    {available ? "Available" : "Not in this release"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
                {available && (
                  <a
                    href={release.downloadUrl}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#176b45] hover:underline"
                  >
                    Download <ArrowRight className="size-4" />
                  </a>
                )}
              </article>
            ))}
          </div>
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
