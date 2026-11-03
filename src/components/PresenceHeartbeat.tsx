import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

const HEARTBEAT_MS = 45 * 1000;

/** Keeps the signed-in account marked online while a website tab is open. */
export function PresenceHeartbeat() {
  const { user } = useAuth();
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const ping = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void heartbeat({}).catch(() => {
        // Presence is best effort; never surface a heartbeat failure to the page.
      });
    };
    ping();
    const timer = window.setInterval(ping, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.userId, heartbeat]);

  return null;
}
