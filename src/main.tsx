import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { Wordmark } from "@/components/Wordmark";
import { LegalPolicyGate } from "@/components/LegalPolicyGate";
import { OfflinePage } from "@/components/OfflinePage";
import { StaffSignInNotice } from "@/components/StaffSignInNotice";
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";
import { DeviceSessionTracker } from "@/components/DeviceSessionTracker";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const News = lazy(() => import("./pages/News.tsx"));
const Media = lazy(() => import("./pages/Media.tsx"));
const Downloads = lazy(() => import("./pages/Downloads.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const Creators = lazy(() => import("./pages/Creators.tsx"));
const CreatorVerification = lazy(() => import("./pages/CreatorVerification.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));
const TicketStatus = lazy(() => import("./pages/TicketStatus.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Learning = lazy(() => import("./pages/Learning.tsx"));
const Worlds = lazy(() => import("./pages/Worlds.tsx"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile.tsx"));
const Inbox = lazy(() => import("./pages/Inbox.tsx"));
const WorldDetails = lazy(() => import("./pages/WorldDetails.tsx"));
const Roadmap = lazy(() => import("./pages/Roadmap.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const Rules = lazy(() => import("./pages/Rules.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const CareerRolePage = lazy(() => import("./pages/CareerRole.tsx"));
const CareerApplicationPage = lazy(() => import("./pages/CareerApplication.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Moderation = lazy(() => import("./pages/Moderation.tsx"));

const Staff = lazy(  () =>
    import("./pages/Staff.tsx").then((module) => ({
      default: module.StaffWorkspace,
    })),
);

const StaffOverview = lazy(
  () =>
    import("./pages/Staff.tsx").then((module) => ({ default: module.StaffOverview })),
);
const StaffAnnouncements = lazy(
  () =>
    import("./pages/Staff.tsx").then((module) => ({ default: module.StaffAnnouncements })),
);
const StaffMessages = lazy(
  () =>
    import("./pages/Staff.tsx").then((module) => ({ default: module.StaffMessages })),
);
const StaffAppeals = lazy(
  () =>
    import("./pages/Staff.tsx").then((module) => ({ default: module.StaffAppeals })),
);

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="ow-route-loader" role="status" aria-label="Loading page">
      <Wordmark className="size-10" label="" />
      <span className="ow-route-loader__bar" aria-hidden="true" />
      <span className="text-xs text-slate-500">Loading…</span>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("[VlyToolbar] Disabled after error:", error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

type ErrorDetail = { name: string; message: string; stack: string };

/** Turn anything thrown into a readable message instead of a generic notice. */
function describeError(error: unknown): ErrorDetail {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "No message was provided.",
      stack: error.stack ?? "",
    };
  }
  if (typeof error === "string") {
    return { name: "Error", message: error, stack: "" };
  }
  try {
    return { name: "Error", message: JSON.stringify(error), stack: "" };
  } catch {
    return { name: "Error", message: String(error), stack: "" };
  }
}

/** Full-page message shown when rendering fails, with the real reason. */
function RenderErrorScreen({ error }: { error: unknown }) {
  const detail = describeError(error);
  return (
    <div className="min-h-screen bg-white p-6 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[#b42318]">Something went wrong</p>
        <h1 className="mt-2 break-words text-xl font-semibold tracking-tight">
          {detail.name}: {detail.message}
        </h1>
        {import.meta.env.DEV && detail.stack && (
          <pre className="mt-4 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">
            {detail.stack}
          </pre>
        )}
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Reload the page to try again. If it keeps happening, send this message to contact@openworlds.dk.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-10 items-center rounded-sm bg-[#14583c] px-4 text-sm font-semibold text-white hover:bg-[#0f4630]"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

/** Hard guard so runtime errors show their real message instead of a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    console.error("[OpenWorlds] Render failed:", error);
  }
  render() {
    return this.state.error ? <RenderErrorScreen error={this.state.error} /> : this.props.children;
  }
}

/** Errors that never reach React (async callbacks, failed requests) get a small
 *  dismissible notice with the actual message rather than a generic banner. */
function installRuntimeErrorNotice() {
  if (typeof document === "undefined") return;
  const show = (error: unknown) => {
    const detail = describeError(error);
    let panel = document.getElementById("ow-runtime-error");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "ow-runtime-error";
      panel.setAttribute("role", "alert");
      panel.style.cssText =
        "position:fixed;bottom:16px;left:16px;right:16px;max-width:38rem;z-index:2147483647;" +
        "background:#111f18;color:#f5f7f4;border:1px solid #3b5a49;border-left:3px solid #c0392b;" +
        "border-radius:4px;padding:12px 14px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;" +
        "box-shadow:0 8px 24px rgba(0,0,0,0.25);";

      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Dismiss";
      close.style.cssText =
        "position:absolute;top:8px;right:8px;background:none;border:0;color:#9fb3a8;font:inherit;cursor:pointer;";
      close.addEventListener("click", () => panel?.remove());

      const text = document.createElement("pre");
      text.id = "ow-runtime-error-text";
      text.style.cssText = "margin:0;padding-right:64px;white-space:pre-wrap;word-break:break-word;";

      panel.append(close, text);
      document.body.appendChild(panel);
    }
    const text = panel.querySelector("#ow-runtime-error-text");
    if (text) {
      const stack = import.meta.env.DEV ? detail.stack.split("\n").slice(0, 6).join("\n") : "";
      text.textContent = `OpenWorlds error — ${detail.name}: ${detail.message}${stack ? `\n\n${stack}` : ""}`;
    }
  };

  window.addEventListener("error", (event) => {
    if (event.error) show(event.error);
  });
  window.addEventListener("unhandledrejection", (event) => show(event.reason));
}

installRuntimeErrorNotice();

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://blissful-lynx-171.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <PresenceHeartbeat />
          <DeviceSessionTracker />
          <StaffSignInNotice />
          <OfflinePage>
            <LegalPolicyGate>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/news" element={<News />} />
              <Route path="/media" element={<Media />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/about" element={<About />} />
              <Route path="/community" element={<Community />} />
              <Route
                path="/creators"
                element={
                  <RequireAuth
                    title="Creator Space"
                    description="Sign in with an approved creator, staff, or administrator account to continue."
                  >
                    <Creators />
                  </RequireAuth>
                }
              />
              <Route
                path="/staff/creators"
                element={
                  <RequireAuth
                    title="Sign in"
                    description="Sign in with your OpenWorlds account. Staff access is detected automatically."
                    accessLevel="staff"
                  >
                    <CreatorVerification />
                  </RequireAuth>
                }
              />
              <Route path="/learning" element={<Learning />} />
              <Route path="/worlds" element={<Worlds />} />
              <Route path="/worlds/:worldId" element={<WorldDetails />} />
              <Route path="/players/:username" element={<PlayerProfile />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/events" element={<Events />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/status" element={<TicketStatus />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/admin"
                element={
                  <RequireAuth
                    title="Admin sign in"
                    description="Sign in with your approved OpenWorlds admin email to access the admin console."
                    redirectImmediately
                    accessLevel="admin"
                  >
                    <Admin />
                  </RequireAuth>
                }
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/player-login" element={<Auth mode="player-login" />} />
              <Route path="/player-signup" element={<Auth mode="player-signup" />} />
              <Route path="/create-account" element={<Auth mode="player-signup" />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/careers/role/:roleSlug" element={<CareerRolePage />} />
              <Route path="/careers/apply/:roleSlug" element={<CareerApplicationPage />} />
              <Route path="/applications" element={<NotFound />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/moderation"
                element={
                  <RequireAuth
                    title="Trust & Safety sign in"
                    description="The moderation console is for staff accounts with a department and position assignment."
                    accessLevel="staff"
                  >
                    <Moderation />
                  </RequireAuth>
                }
              />
              <Route
                path="/inbox"
                element={
                  <RequireAuth
                    title="Sign in to open your inbox"
                    description="Friend requests and connection updates are private to you. Sign in with your OpenWorlds account to continue."
                  >
                    <Inbox />
                  </RequireAuth>
                }
              />
              <Route
                path="/staff"
                element={
                  <RequireAuth
                    title="Sign in"
                    description="The OpenWorlds company portal is for approved staff accounts. Use your usual OpenWorlds sign-in."
                    accessLevel="staff"
                  >
                    <Staff isAdmin={false} userId={undefined as any} />
                  </RequireAuth>
                }
              />
              <Route path="/staff/overview" element={<RequireAuth accessLevel="staff"><StaffOverview /></RequireAuth>} />
              <Route path="/staff/announcements" element={<RequireAuth accessLevel="staff"><StaffAnnouncements /></RequireAuth>} />
              <Route path="/staff/messages" element={<RequireAuth accessLevel="staff"><StaffMessages /></RequireAuth>} />
              <Route path="/staff/appeals" element={<RequireAuth accessLevel="staff"><StaffAppeals /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />                </Routes>
              </Suspense>
            </LegalPolicyGate>
          </OfflinePage>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
