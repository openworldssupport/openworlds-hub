import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RequireAuth } from "./src/components/RequireAuth";
import DashboardPage from "./src/pages/Dashboard.tsx";
import { StaffAppeals, StaffDepartments, StaffWorkspace } from "./src/pages/Staff.tsx";
import InboxPage from "./src/pages/Inbox.tsx";

/** Mirrors the real /dashboard route: page behind the RequireAuth guard. */
const GuardedDashboard = () => (
  <RequireAuth title="Sign in to see your hub" description="Your OpenWorlds player hub is available to signed-in members.">
    <DashboardPage />
  </RequireAuth>
);

/** Mirrors the real /inbox route: notifications behind the RequireAuth guard. */
const GuardedInbox = () => (
  <RequireAuth title="Sign in to open your inbox" description="Friend requests and connection updates are private to you.">
    <InboxPage />
  </RequireAuth>
);

/** Mirrors the real /staff route: company portal behind the RequireAuth guard. */
const GuardedStaff = () => (
  <RequireAuth title="Staff sign in" description="The OpenWorlds company portal is for admins and company staff.">
    <StaffWorkspace isAdmin={false} userId={undefined as any} />
  </RequireAuth>
);

const GuardedStaffAppeals = () => (
  <RequireAuth title="Staff sign in" description="Moderation appeals are for authorized company staff.">
    <StaffAppeals />
  </RequireAuth>
);

const client = new ConvexReactClient("https://smoke-test.convex.cloud");

type RouteEntry = {
  path: string;
  /** Router pattern used to mount the page; defaults to `path`. */
  pattern?: string;
  name: string;
  load: () => Promise<{ default?: React.ComponentType }>;
  /** Text the rendered page must contain. */
  expect?: string[];
};

const routes: RouteEntry[] = [
  { path: "/", name: "Landing", load: () => import("./src/pages/Landing.tsx"), expect: ["OpenWorlds"] },
  { path: "/about", name: "About", load: () => import("./src/pages/About.tsx") },
  { path: "/community", name: "Community", load: () => import("./src/pages/Community.tsx") },
  { path: "/worlds", name: "Worlds", load: () => import("./src/pages/Worlds.tsx") },
  { path: "/roadmap", name: "Roadmap", load: () => import("./src/pages/Roadmap.tsx") },
  { path: "/events", name: "Events", load: () => import("./src/pages/Events.tsx") },
  { path: "/rules", name: "Rules", load: () => import("./src/pages/Rules.tsx") },
  { path: "/learning", name: "Learning", load: () => import("./src/pages/Learning.tsx") },
  { path: "/news", name: "News", load: () => import("./src/pages/News.tsx") },
  { path: "/downloads", name: "Downloads", load: () => import("./src/pages/Downloads.tsx") },
  {
    path: "/careers",
    name: "Careers",
    load: () => import("./src/pages/Careers.tsx"),
    expect: ["Player Support", "Quality Assurance", "Voluntary · unpaid"],
  },
  {
    path: "/careers/role/demo",
    pattern: "/careers/role/:roleSlug",
    name: "CareerRole (unknown)",
    load: () => import("./src/pages/CareerRole.tsx"),
    expect: ["Position not found"],
  },
  {
    path: "/careers/role/player-support-specialist",
    pattern: "/careers/role/:roleSlug",
    name: "CareerRole (support)",
    load: () => import("./src/pages/CareerRole.tsx"),
    expect: ["Player Support Specialist", "Voluntary · unpaid"],
  },
  {
    path: "/careers/apply/player-support-specialist",
    pattern: "/careers/apply/:roleSlug",
    name: "CareerApply",
    load: () => import("./src/pages/CareerApplication.tsx"),
    expect: ["Volunteer availability", "Time zone", "Voluntary, unpaid"],
  },
  {
    path: "/players/example",
    pattern: "/players/:username",
    name: "PlayerProfile",
    load: () => import("./src/pages/PlayerProfile.tsx"),
    expect: ["Back to discovery"],
  },
  {
    path: "/worlds/example",
    pattern: "/worlds/:worldId",
    name: "WorldDetails",
    load: () => import("./src/pages/WorldDetails.tsx"),
    expect: ["Back to discovery"],
  },
  { path: "/media", name: "Media", load: () => import("./src/pages/Media.tsx"), expect: ["Apply to be featured"] },
  { path: "/support", name: "Support", load: () => import("./src/pages/Support.tsx") },
  { path: "/support/status", name: "TicketStatus", load: () => import("./src/pages/TicketStatus.tsx") },
  { path: "/privacy", name: "Privacy", load: () => import("./src/pages/Privacy.tsx") },
  { path: "/terms", name: "Terms", load: () => import("./src/pages/Terms.tsx") },
  { path: "/auth", name: "Auth", load: () => import("./src/pages/Auth.tsx"), expect: ["OpenWorlds sign in", "email code"] },
  {
    path: "/player-signup",
    name: "PlayerSignup",
    load: () => import("./src/pages/Auth.tsx").then((module) => ({ default: () => React.createElement(module.default, { mode: "player-signup" }) })),
  },
  {
    path: "/player-login",
    name: "PlayerLogin",
    load: () => import("./src/pages/Auth.tsx").then((module) => ({ default: () => React.createElement(module.default, { mode: "player-login" }) })),
    expect: ["OpenWorlds sign in"],
  },
  { path: "/admin", name: "Admin", load: () => import("./src/pages/Admin.tsx") },
  { path: "/moderation", name: "Moderation console", load: () => import("./src/pages/Moderation.tsx") },
  { path: "/dashboard", name: "Dashboard (guarded)", load: async () => ({ default: GuardedDashboard }) },
  { path: "/inbox", name: "Inbox (guarded)", load: async () => ({ default: GuardedInbox }) },
  { path: "/staff", name: "Staff (guarded)", load: async () => ({ default: GuardedStaff }) },
  { path: "/staff/departments", name: "Staff departments", load: async () => ({ default: StaffDepartments }) },
  { path: "/staff/appeals", name: "Staff appeals (guarded)", load: async () => ({ default: GuardedStaffAppeals }) },
  { path: "/platform-info", name: "PlatformInfo", load: () => import("./src/pages/PlatformInfo.tsx") },
  { path: "/nope", pattern: "*", name: "NotFound", load: () => import("./src/pages/NotFound.tsx") },
];

const failures: string[] = [];

for (const { path, pattern, name, load, expect } of routes) {
  try {
    const mod = (await load()) as { default?: React.ComponentType };
    const Page = mod.default;
    if (typeof Page !== "function") throw new Error("no default export component");
    const html = renderToString(
      <ConvexAuthProvider client={client}>
        <ConvexProvider client={client}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={pattern ?? path} element={<Page />} />
            </Routes>
          </MemoryRouter>
        </ConvexProvider>
      </ConvexAuthProvider>,
    );
    if (html.length < 80) throw new Error(`suspiciously short output (${html.length} chars)`);
    for (const text of expect ?? []) {
      if (!html.includes(text)) throw new Error(`missing expected text: ${JSON.stringify(text)}`);
    }
    if (name === "Dashboard (guarded)" || name === "Staff (guarded)") {
      const state = html.includes("Sign in to continue")
        ? "sign-in gate"
        : html.includes("animate-spin")
          ? "loading spinner (auth resolves client-side)"
          : "unrecognised guard state";
      console.log(`      guard state -> ${state}`);
    }
    console.log(`PASS  ${path.padEnd(42)} ${name.padEnd(24)} ${String(html.length).padStart(6)} chars`);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}` : String(error);
    failures.push(`${name} (${path}): ${message}`);
    console.log(`FAIL  ${path.padEnd(42)} ${name.padEnd(24)} ${message.slice(0, 140)}`);
  }
}

console.log(`\n${routes.length - failures.length}/${routes.length} pages rendered`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(` - ${failure}`);
  process.exit(1);
}
