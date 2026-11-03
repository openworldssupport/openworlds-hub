import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function promptKey(userId: string, createdAt: number) {
  return `openworlds-staff-conversion:${userId}:${createdAt}`;
}

/**
 * Watches for a conversion started by an administrator and opens immediately
 * on the account holder's screen. Dismissal is remembered for that code only;
 * a newly generated code opens the prompt again.
 */
export function StaffConversionPrompt() {
  const { user } = useAuth();
  const pending = useQuery(
    api.admin.myPendingStaffConversion,
    user ? {} : "skip",
  );
  const confirmConversion = useMutation(api.admin.confirmStaffConversion);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ email: string; department: string; position: string } | null>(null);
  const key = user?.userId && pending ? promptKey(user.userId, pending.createdAt) : null;

  useEffect(() => {
    if (!key || pending?.expired) return;
    try {
      if (window.sessionStorage.getItem(key) === "seen") return;
    } catch {
      // Storage can be unavailable; the prompt still opens for this session.
    }
    setOpen(true);
  }, [key, pending?.expired]);

  function dismiss() {
    if (key) {
      try {
        window.sessionStorage.setItem(key, "seen");
      } catch {
        // Ignore storage failures.
      }
    }
    setOpen(false);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (normalized.length !== 8) {
      setError("Enter the 8-character confirmation code from the administrator.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const confirmed = await confirmConversion({ code: normalized });
      setResult({
        email: confirmed.email,
        department: confirmed.department,
        position: confirmed.position,
      });
      setCode("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not confirm the staff conversion.");
    } finally {
      setBusy(false);
    }
  }

  if (!user || (!pending && !result)) return null;

  return (
    <Dialog
      open={open || Boolean(result)}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
          return;
        }
        if (result) {
          setResult(null);
          setOpen(false);
        } else dismiss();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-700" />
                Staff access confirmed
              </DialogTitle>
              <DialogDescription>
                Your account is now assigned to {result.department} / {result.position}. The same account keeps its profile, friends, messages, and game data.
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
              The company email on your account is {result.email}. You can sign in with a one-time code sent there the next time you are signed out.
            </p>
            <DialogFooter>
              <Button asChild>
                <Link to="/staff" onClick={() => { setResult(null); setOpen(false); }}>Open staff workspace</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber-700" />
                Confirm your staff conversion
              </DialogTitle>
              <DialogDescription>
                An administrator started converting your account to {pending?.department} / {pending?.position}. Enter the private confirmation code they gave you. Nothing changes until you confirm.
              </DialogDescription>
            </DialogHeader>

            {pending?.expired ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                This code expired. Ask the administrator to generate a new one.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="staff-conversion-prompt-code">Confirmation code</Label>
                  <Input
                    id="staff-conversion-prompt-code"
                    autoComplete="off"
                    required
                    maxLength={9}
                    value={code}
                    onChange={(event) => {
                      const raw = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
                      setCode(raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw);
                    }}
                    placeholder="ABCD-EFGH"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    The code is sent only through the administrator. It expires {pending ? new Date(pending.expiresAt).toLocaleString() : ""} and only works for your account.
                  </p>
                </div>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={dismiss}>Later</Button>
                  <Button type="submit" disabled={busy || code.replace(/[^A-Z0-9]/g, "").length !== 8}>
                    {busy ? "Confirming…" : "Confirm staff access"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
