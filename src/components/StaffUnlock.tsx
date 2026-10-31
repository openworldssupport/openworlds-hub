import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The single prompt for sensitive staff actions. A code from the member's own
 * authenticator app unlocks staff tools for this session for 15 minutes.
 */
export function StaffUnlock({ description }: { description?: string }) {
  const status = useQuery(api.staffUnlock.status);
  const unlock = useMutation(api.staffUnlock.unlock);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (status === undefined || !status.canAct) return null;
  if (status.verifiedUntil > Date.now()) {
    return <p role="status" className="text-sm text-slate-600">Unlocked for this session.</p>;
  }
  if (!status.enrolled) {
    return (
      <div>
        <p className="text-sm leading-6 text-slate-600">Add an authenticator app to your account first. Sensitive staff actions use a code from that app instead of an emailed code.</p>
        <Button asChild variant="outline" className="mt-3"><Link to="/staff/overview">Open Account security</Link></Button>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await unlock({ code });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="max-w-2xl text-sm leading-6 text-slate-600">{description ?? "Confirm it's you with the 6-digit code from your authenticator app. Staff tools stay unlocked for 15 minutes."}</p>
      <form onSubmit={(event) => void submit(event)} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs space-y-1.5">
          <Label htmlFor="staff-unlock-code">Authenticator code</Label>
          <Input
            id="staff-unlock-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={40}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^0-9A-F-]/g, "").slice(0, 40))}
            placeholder="000000"
          />
        </div>
        <Button type="submit" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Unlock"}</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
