import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

const DEVICE_STORAGE_KEY = "openworlds.device-id";
const REFRESH_MS = 5 * 60 * 1000;
let fallbackDeviceId: string | null = null;

function newDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Stable per-browser identifier used only to recognise a returning device. */
function getDeviceId() {
  try {
    const stored = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored && /^[A-Za-z0-9._:-]{8,128}$/.test(stored)) return stored;
    const created = newDeviceId();
    window.localStorage.setItem(DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    if (!fallbackDeviceId) fallbackDeviceId = newDeviceId();
    return fallbackDeviceId;
  }
}

/**
 * Records the browser for the current auth session and refreshes its last-seen
 * time. The backend sends the new-device email only when the account has a
 * verified address and the device has not been seen before.
 */
export function DeviceSessionTracker() {
  const { user, signOut } = useAuth();
  const register = useMutation(api.accountDevices.register);
  const hasAccount = Boolean(user?.role);
  const session = useQuery(api.accountDevices.currentSession, hasAccount ? {} : "skip");

  // If this session is revoked from another device (or by "Sign out all"),
  // clear this tab as soon as the deletion is observed.
  useEffect(() => {
    if (hasAccount && session?.active === false) void signOut();
  }, [hasAccount, session?.active, signOut]);

  useEffect(() => {
    if (!hasAccount) return;
    let cancelled = false;
    const record = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void register({ deviceId: getDeviceId(), userAgent: navigator.userAgent }).catch((error) => {
        console.warn("[account-security] Could not record this device:", error);
      });
    };
    record();
    const timer = window.setInterval(record, REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") record();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.userId, hasAccount, register]);

  return null;
}
