import { Globe2 } from "lucide-react";
import { Link } from "react-router";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5" aria-label="OpenWorlds home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#2870e8] text-white"><Globe2 className="size-5" /></span>
          <span className="font-semibold tracking-tight">OpenWorlds</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Home</Link>
          <Link to="/#about" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">About</Link>
          <Link to="/community" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Community</Link>
          <Link to="/learning" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Learning</Link>
          <Link to="/news" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">News</Link>
          <Link to="/downloads" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Downloads</Link>
          <Link to="/careers" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Careers</Link>
          <Link to="/#contact" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Contact</Link>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <Link to="/auth" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Log in</Link>
          <Link to="/create-account" className="rounded-lg bg-[#2870e8] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1f5fc9]">Create account</Link>
        </div>
      </nav>
    </header>
  );
}
