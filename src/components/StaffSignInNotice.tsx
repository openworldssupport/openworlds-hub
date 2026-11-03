import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { ShieldCheck, UserCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function noticeKey(userId: string) {
  return `openworlds-staff-signin-notice:${userId}`;
}

/**
 * Shown once per browser session after a staff account signs in through the
 * normal sign-in page. Staff accounts are detected from their verified staff
 * access, never from which login page was used.
 */
export function StaffSignInNotice() {
  const { user } = useAuth();
  const staff = useQuery(api.staff.me, user ? {} : "skip");
  const security = useQuery(api.accountSecurity.status, user && staff?.isStaff ? {} : "skip");
  const [open, setOpen] = useState(false);
  const key = user?.userId ? noticeKey(user.userId) : null;

  useEffect(() => {
    if (!user || !staff?.isStaff || !key) return;
    try {
      if (window.sessionStorage.getItem(key) === "seen") return;
    } catch {
      // Storage can be unavailable; the notice still shows for this session.
    }
    setOpen(true);
  }, [user?.userId, staff?.isStaff, key]);

  function dismiss() {
    if (key) {
      try {
        window.sessionStorage.setItem(key, "seen");
      } catch {
        // Ignore storage failures.
      }
    }
    setOpen(false);
  }

  if (!user || !staff?.isStaff) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Staff account detected</DialogTitle>
          <DialogDescription>
            You’re signed in as {staff.name || staff.nickname || user.playerName}. OpenWorlds recognised this as a staff account, so extra protections are active.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 text-sm leading-6 text-slate-600">
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#176b45]" aria-hidden="true" />
            <span><strong className="text-slate-800">Staff tools stay locked.</strong> Sensitive staff and moderation actions need an authenticator unlock for this session.</span>
          </li>
          <li className="flex gap-3">
            <UserCheck className="mt-0.5 size-4 shrink-0 text-[#176b45]" aria-hidden="true" />
            <span>
              <strong className="text-slate-800">Two-step verification:</strong>{" "}
              {security === undefined ? "Checking…" : security.enabled ? "enabled on this account." : "not set up yet."}{" "}
              {security && !security.enabled && <Link to="/dashboard" onClick={dismiss} className="font-medium text-[#176b45] hover:underline">Set it up now</Link>}
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#176b45]" aria-hidden="true" />
            <span><strong className="text-slate-800">Actions are recorded.</strong> Bans and report decisions are logged with your account and the reason you give.</span>
          </li>
        </ul>

        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          You can turn on two-step verification, manage recovery codes, and update your staff display name from Account security on your dashboard or in the staff workspace.
        </p>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={dismiss}>Continue</Button>
          <Button asChild><Link to="/staff" onClick={dismiss}>Open staff workspace</Link></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
