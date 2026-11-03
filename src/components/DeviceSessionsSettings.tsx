import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Laptop, LogOut, Smartphone, Tablet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function formatTime(value: number) {
  try {
    return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Unknown time";
  }
}

function DeviceIcon({ type }: { type: "desktop" | "phone" | "tablet" | null }) {
  const Icon = type === "phone" ? Smartphone : type === "tablet" ? Tablet : Laptop;
  return <Icon className="size-4 shrink-0 text-slate-500" aria-hidden="true" />;
}

export function DeviceSessionsSettings() {
  const { user, signOut } = useAuth();
  const data = useQuery(api.accountDevices.devices, user ? {} : "skip");
  const revoke = useMutation(api.accountDevices.revoke);
  const signOutAll = useMutation(api.accountDevices.signOutAll);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;
  const devices = data?.devices ?? [];
  const activeNow = Date.now() - 5 * 60 * 1000;

  async function endDevice(sessionId: string) {
    setBusy(sessionId);
    setMessage("");
    setError("");
    try {
      await revoke({ sessionId });
      setMessage("That device has been signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out that device.");
    } finally {
      setBusy(null);
    }
  }

  async function endAllDevices() {
    if (!window.confirm("Sign out every device signed in to your account, including this one?")) return;
    setBusy("all");
    setMessage("");
    setError("");
    try {
      await signOutAll({});
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out all devices.");
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Signed-in devices</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Every browser session currently signed in to your account. Sign out a device you don&apos;t recognise, or sign out everywhere.
          </p>
        </div>
        {data && <span className="text-xs text-slate-500">{devices.length} active</span>}
      </div>

      {data === undefined ? (
        <p className="mt-3 text-sm text-slate-500">Loading devices…</p>
      ) : devices.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No active sessions found.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 border border-slate-200">
          {devices.map((device) => (
            <li key={device.sessionId} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-start gap-3">
                <DeviceIcon type={device.deviceType} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {device.label}
                    {device.current && <span className="ml-2 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">This device</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {device.lastSeenAt >= activeNow ? "Active now" : `Last active ${formatTime(device.lastSeenAt)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Signed in {formatTime(device.createdAt)}</p>
                </div>
              </div>
              {!device.current && (
                <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void endDevice(device.sessionId)}>
                  <LogOut className="size-3.5" />{busy === device.sessionId ? "Signing out…" : "Sign out"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs leading-5 text-slate-500">
          {data?.emailAlerts
            ? "New-device alerts are on: we email your verified address when an unrecognised device signs in."
            : "Add and verify a recovery email to be emailed when a new device signs in."}
        </p>
        <Button type="button" size="sm" variant="outline" className="text-red-700" disabled={busy !== null || devices.length === 0} onClick={() => void endAllDevices()}>
          <LogOut className="size-3.5" />{busy === "all" ? "Signing out…" : "Sign out all devices"}
        </Button>
      </div>
      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
