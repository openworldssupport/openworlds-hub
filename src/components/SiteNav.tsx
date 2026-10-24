import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { badgeForUser, displayInitials, displayNameFor } from "@/lib/staff";
import { RoleBadge } from "@/components/RoleBadge";
import { SiteStatusNotice } from "@/components/SiteStatusNotice";

export function SiteNav() {
  const { user } = useAuth();
  // Signed-in staff see their public "Staff" / "Dev" badge here on the normal
  // website; it doubles as the link into the company portal at /staff.
  const badge = badgeForUser(user);

  return (
    <header className="site-nav sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <SiteStatusNotice />
      <div className="holiday-greeting flex items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em]">
        <span aria-hidden="true">✦</span>
        <span>Merry Christmas from OpenWorlds</span>
        <span aria-hidden="true">✦</span>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5" aria-label="OpenWorlds home">
          <img src="/logo.svg" alt="" width={36} height={36} className="size-9 rounded-lg" />
          <span className="font-semibold tracking-tight">OpenWorlds</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-xs lg:text-sm">
          <Link to="/" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Home</Link>
          <Link to="/about" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">About</Link>
          <Link to="/community" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Community</Link>
          <Link to="/worlds" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Worlds</Link>
          <Link to="/events" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Events</Link>
          <Link to="/roadmap" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Roadmap</Link>
          <Link to="/learning" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Learning</Link>
          <Link to="/news" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">News</Link>
          <Link to="/downloads" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Downloads</Link>
          <Link to="/careers" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Careers</Link>
          <Link to="/support" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Support</Link>
          <Link to="/rules" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Rules</Link>
          {user?.role === "user" ? (
            <Link to="/dashboard" className="rounded-md px-2 py-2 font-medium text-[#0066cc] hover:bg-blue-50">Player home</Link>
          ) : user ? (
            <Link to="/dashboard" className="rounded-md px-2 py-2 text-slate-600 hover:bg-slate-100">Player account</Link>
          ) : (
            <>
              <Link to="/player-login" className="rounded-md px-2 py-2 text-slate-600 hover:bg-slate-100">Player log in</Link>
              <Link to="/player-signup" className="rounded-md px-2 py-2 font-medium text-[#0066cc] hover:bg-blue-50">Player sign up</Link>
            </>
          )}
          {user?.role !== "member" && user?.role !== "admin" && (
            <Button asChild size="sm" variant="outline" className="ml-1">
              <Link to="/auth?returnTo=%2Fstaff">Staff sign in</Link>
            </Button>
          )}
          {badge && (
            <Link
              to="/staff"
              title="Open the company portal"
              className="ml-1 inline-flex items-center rounded-md px-1 py-1 hover:bg-slate-100"
            >
              <RoleBadge badge={badge} />
            </Link>
          )}
          {user && badge && (
            <span className="ml-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                {displayInitials(user)}
              </span>
              <span className="max-w-[140px] truncate">{displayNameFor(user)}</span>
            </span>
          )}
        </div>

      </nav>
    </header>
  );
}
