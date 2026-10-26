import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { LegalPolicyGate } from "@/components/LegalPolicyGate";
import { OfflinePage } from "@/components/OfflinePage";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const News = lazy(() => import("./pages/News.tsx"));
const Downloads = lazy(() => import("./pages/Downloads.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));
const TicketStatus = lazy(() => import("./pages/TicketStatus.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Learning = lazy(() => import("./pages/Learning.tsx"));
const Worlds = lazy(() => import("./pages/Worlds.tsx"));
const Roadmap = lazy(() => import("./pages/Roadmap.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const Rules = lazy(() => import("./pages/Rules.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const CareerRolePage = lazy(() => import("./pages/CareerRole.tsx"));
const CareerApplicationPage = lazy(() => import("./pages/CareerApplication.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));

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

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
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
  componentDidCatch(_err: Error) {
    console.warn("[VlyToolbar] Error; toolbar disabled.");
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(_error: Error) {
    return {
      hasError: true,
      message: "Unexpected application error.",
      stack: "",
    };
  }
  componentDidCatch(_err: Error) {
    console.error("[Preview] Root render failed.");
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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
          <OfflinePage>
            <LegalPolicyGate>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/news" element={<News />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/about" element={<About />} />
              <Route path="/community" element={<Community />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/worlds" element={<Worlds />} />
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
                path="/staff"
                element={
                  <RequireAuth
                    title="Staff sign in"
                    description="The OpenWorlds company portal is for approved staff accounts."
                    signUpHref="/auth?mode=staff-signup&returnTo=%2Fstaff"
                  >
                    <Staff isAdmin={false} userId={undefined as any} />
                  </RequireAuth>
                }
              />
              <Route path="/staff/overview" element={<StaffOverview />} />
              <Route path="/staff/announcements" element={<StaffAnnouncements />} />
              <Route path="/staff/messages" element={<StaffMessages />} />
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
