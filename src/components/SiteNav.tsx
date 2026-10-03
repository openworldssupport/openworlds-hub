import { Link } from "react-router";

export function SiteNav() {
  return (
    <header className="site-nav sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5" aria-label="OpenWorlds home">
          <img src="/logo.svg" alt="" width={36} height={36} className="size-9 rounded-lg" />
          <span className="font-semibold tracking-tight">OpenWorlds</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-xs lg:text-sm">
          <Link to="/" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Home</Link>
          <a href="/#about" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">About</a>
          <Link to="/community" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Community</Link>
          <Link to="/learning" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Learning</Link>
          <Link to="/news" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">News</Link>
          <Link to="/downloads" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Downloads</Link>
          <Link to="/careers" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Careers</Link>
          <a href="/#contact" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Contact</a>
        </div>

      </nav>
    </header>
  );
}
