import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteStatusNotice } from "@/components/SiteStatusNotice";
import { careerBranches, careerRoles } from "@/lib/careers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SiteNav() {
  const { user, isLoading, signOut } = useAuth();
  const staffInfo = useQuery(api.staff.me, user && user.role !== "user" ? {} : "skip");
  const markWelcomeShown = useMutation(api.staff.markWelcomeShown);
  const isStaffAccount = Boolean(staffInfo?.isStaff);
  const welcomeDetails = isStaffAccount ? staffInfo?.welcome : null;
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeBusy, setWelcomeBusy] = useState(false);
  const [welcomeError, setWelcomeError] = useState("");
  const matchedRole = welcomeDetails
    ? careerRoles.find((role) => role.title.trim().toLowerCase() === welcomeDetails.position.trim().toLowerCase())
    : undefined;
  const matchedDepartment = welcomeDetails
    ? careerBranches.find((branch) => branch.title.trim().toLowerCase() === welcomeDetails.department.trim().toLowerCase())
    : undefined;

  useEffect(() => {
    if (welcomeDetails) setWelcomeOpen(true);
  }, [staffInfo?.userId, welcomeDetails?.department, welcomeDetails?.position, welcomeDetails?.isAdmin]);

  async function acknowledgeWelcome() {
    setWelcomeBusy(true);
    setWelcomeError("");
    try {
      await markWelcomeShown();
      setWelcomeOpen(false);
    } catch {
      setWelcomeError("We could not save that you have seen this welcome. Please try again.");
    } finally {
      setWelcomeBusy(false);
    }
  }

  return (
    <header className="site-nav sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <SiteStatusNotice />
      <Dialog
        open={welcomeOpen && Boolean(welcomeDetails)}
        onOpenChange={(open) => {
          if (!open && welcomeDetails && !welcomeBusy) void acknowledgeWelcome();
          if (open) setWelcomeOpen(true);
        }}
      >
        <DialogContent showCloseButton={!welcomeBusy}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Welcome to the team!</DialogTitle>
            <DialogDescription>
              We’re glad to have you with OpenWorlds. Here’s a quick look at your role.
            </DialogDescription>
          </DialogHeader>
          {welcomeDetails && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Position</p>
                <p className="mt-1 font-semibold text-slate-900">{welcomeDetails.position}</p>
                <p className="text-sm text-slate-600">{welcomeDetails.department}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What you’ll do</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {matchedRole?.summary ?? matchedDepartment?.summary ?? (welcomeDetails.isAdmin
                    ? "Help guide OpenWorlds, support the team, and oversee platform operations."
                    : `As ${welcomeDetails.position} in ${welcomeDetails.department}, you’ll contribute to your department’s work and collaborate with the OpenWorlds team.`)}
                </p>
                {matchedRole && <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{matchedRole.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}</ul>}
              </div>
              {welcomeError && <p role="alert" className="text-sm text-red-700">{welcomeError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" disabled={welcomeBusy} onClick={() => void acknowledgeWelcome()}>
              {welcomeBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              {welcomeBusy ? "Saving…" : "Thanks, let’s go"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          {user?.canAccessCreatorSpace && <Link to="/creators" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Creator Space</Link>}
          <Link to="/worlds" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Worlds</Link>
          <Link to="/events" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Events</Link>
          <Link to="/roadmap" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Roadmap</Link>
          <Link to="/learning" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Learning</Link>
          <Link to="/news" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">News</Link>
          <Link to="/media" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Media</Link>
          <Link to="/downloads" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Downloads</Link>
          <Link to="/careers" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Careers</Link>
          <Link to="/support" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Support</Link>
          <Link to="/rules" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Rules</Link>
          {isStaffAccount && <>
            <Link to="/staff" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Staff workspace</Link>
            <Link to="/staff/creators" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Verify creators</Link>
            {staffInfo?.isAdmin && <Link to="/admin" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Admin console</Link>}
          </>}
          {isLoading ? (
            <span role="status" className="px-2 py-2 text-xs text-slate-500">Checking sign-in…</span>
          ) : user ? (
            <>
              {user.role === "user" && <Link to="/dashboard" className="rounded-md px-2 py-2 font-medium text-[#0066cc] hover:bg-blue-50">Player home</Link>}
              <span className="rounded-md px-2 py-2 text-xs font-medium text-slate-600" aria-label={isStaffAccount ? "Signed in as company staff" : "You are signed in"}>
                {user.role === "user"
                  ? `Signed in${user.playerName ? ` as ${user.playerName}` : ""}`
                  : isLoading || staffInfo === undefined
                    ? "Checking company account…"
                    : isStaffAccount
                      ? "Company Staff"
                      : "Signed in"}
              </span>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => void signOut()}>
                <LogOut className="size-4" />
                <span className="sr-only sm:not-sr-only">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/player-login" className="rounded-md px-2 py-2 text-slate-600 hover:bg-slate-100">Player log in</Link>
              <Link to="/player-signup" className="rounded-md px-2 py-2 font-medium text-[#0066cc] hover:bg-blue-50">Player sign up</Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}
