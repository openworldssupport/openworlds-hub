import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteStatusNotice } from "@/components/SiteStatusNotice";
import { Wordmark } from "@/components/Wordmark";
import { careerBranches, careerRoles } from "@/lib/careers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PRIMARY_LINKS = [
  { to: "/worlds", label: "Worlds" },
  { to: "/news", label: "News" },
  { to: "/downloads", label: "Downloads" },
  { to: "/community", label: "Community" },
  { to: "/support", label: "Support" },
];

const MORE_LINKS = [
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/learning", label: "Learning" },
  { to: "/media", label: "Media" },
  { to: "/careers", label: "Careers" },
  { to: "/rules", label: "Rules" },
];

export function SiteNav() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const staffInfo = useQuery(api.staff.me, isAuthenticated ? {} : "skip");
  const inbox = useQuery(api.users.myInbox, isAuthenticated ? {} : "skip");
  const moderationWarnings = useQuery(api.moderation.myWarnings, isAuthenticated ? {} : "skip");
  const warningCount = moderationWarnings?.warnings.length ?? 0;
  const pendingRequests = inbox && !inbox.needsUsername ? inbox.requests.length : 0;
  const markWelcomeShown = useMutation(api.staff.markWelcomeShown);
  const isStaffAccount = Boolean(staffInfo?.isStaff);
  const welcomeDetails = isStaffAccount ? staffInfo?.welcome : null;
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeBusy, setWelcomeBusy] = useState(false);
  const [welcomeError, setWelcomeError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
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
    <header data-scrolled={scrolled} className="site-nav sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="ow-progress" aria-hidden="true" />
      <SiteStatusNotice />
      {warningCount > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          <span>{warningCount === 1 ? "Your account has a moderation warning." : `Your account has ${warningCount} moderation warnings.`}</span>
          <Link to="/dashboard#account-warnings" className="font-semibold underline underline-offset-2">View details</Link>
        </div>
      )}
      <Dialog
        open={welcomeOpen && Boolean(welcomeDetails)}
        onOpenChange={(open) => {
          if (!open && welcomeDetails && !welcomeBusy) void acknowledgeWelcome();
          if (open) setWelcomeOpen(true);
        }}
      >
        <DialogContent className={isStaffAccount ? "staff-welcome-dialog" : undefined} showCloseButton={!welcomeBusy}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Welcome to the team!</DialogTitle>
            <DialogDescription>We’re glad to have you with OpenWorlds.</DialogDescription>
          </DialogHeader>
          {welcomeDetails && (
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">{welcomeDetails.position}</p>
              <p className="text-sm text-slate-600">{welcomeDetails.department}</p>
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
      <div className="holiday-greeting flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium">
        <span aria-hidden="true">✦</span>
        <span>Merry Christmas from OpenWorlds</span>
        <span aria-hidden="true">❄</span>
        <span aria-hidden="true">✦</span>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5" aria-label="OpenWorlds home">
          <span className="ow-logo">
            <Wordmark className="size-9" label="" />
          </span>
          <span className="font-semibold tracking-tight">OpenWorlds</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-xs lg:text-sm">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">
              {link.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="nav-link rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100" style={{ animationDelay: "240ms" }}>More</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {MORE_LINKS.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link to={link.to}>{link.label}</Link>
                </DropdownMenuItem>
              ))}

            </DropdownMenuContent>
          </DropdownMenu>
          {user?.canAccessCreatorSpace && <Link to="/creators" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Creator Space</Link>}
          {isStaffAccount && <Link to="/staff" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Company Staff</Link>}
          {isLoading ? (
            <span role="status" className="px-2 py-2 text-xs text-slate-500">Checking sign-in…</span>
          ) : user ? (
            <>
              <Link to="/inbox" className="relative rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Inbox{pendingRequests > 0 && <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#176b45] px-1 text-[10px] font-semibold text-white" aria-label={`${pendingRequests} friend requests waiting`}>{pendingRequests}</span>}</Link>
              <Link to="/dashboard" className="rounded-md px-2 py-2 font-medium text-[#0066cc] hover:bg-blue-50">Player home</Link>
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
              <Link to="/player-login" className="rounded-md px-2.5 py-2 text-slate-600 hover:bg-slate-100">Sign in</Link>
              <Link
                to="/player-signup"
                className="nav-cta inline-flex h-9 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}
