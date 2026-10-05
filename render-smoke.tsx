import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RequireAuth } from "./src/components/RequireAuth";
import DashboardPage from "./src/pages/Dashboard.tsx";
import StaffPage from "./src/pages/Staff.tsx";

/** Mirrors the real /dashboard route: page behind the RequireAuth guard. */
const GuardedDashboard = () => (
  <RequireAuth title="Sign in to see your hub" description="Your OpenWorlds player hub is available to signed-in members.">
    <DashboardPage />
  </RequireAuth>
);

/** Mirrors the real /staff route: company portal behind the RequireAuth guard. */
const GuardedStaff = () => (
  <RequireAuth title="Staff sign in" description="The OpenWorlds company portal is for admins and company staff.">
    <StaffPage />
  </RequireAuth>
);

const client = new ConvexReactClient("https://smoke-test.convex.cloud");

const routes = [
  ["/", "Landing", () => import("./src/pages/Landing.tsx")],
  ["/about", "About", () => import("./src/pages/About.tsx")],
  ["/community", "Community", () => import("./src/pages/Community.tsx")],
  ["/worlds", "Worlds", () => import("./src/pages/Worlds.tsx")],
  ["/roadmap", "Roadmap", () => import("./src/pages/Roadmap.tsx")],
  ["/events", "Events", () => import("./src/pages/Events.tsx")],
  ["/rules", "Rules", () => import("./src/pages/Rules.tsx")],
  ["/learning", "Learning", () => import("./src/pages/Learning.tsx")],
  ["/news", "News", () => import("./src/pages/News.tsx")],
  ["/downloads", "Downloads", () => import("./src/pages/Downloads.tsx")],
  ["/careers", "Careers", () => import("./src/pages/Careers.tsx")],
  ["/careers/role/demo", "CareerRole", () => import("./src/pages/CareerRole.tsx")],
  ["/support", "Support", () => import("./src/pages/Support.tsx")],
  ["/support/status", "TicketStatus", () => import("./src/pages/TicketStatus.tsx")],
  ["/privacy", "Privacy", () => import("./src/pages/Privacy.tsx")],
  ["/terms", "Terms", () => import("./src/pages/Terms.tsx")],
  ["/auth", "Auth", () => import("./src/pages/Auth.tsx")],
  ["/admin", "Admin", () => import("./src/pages/Admin.tsx")],
  ["/dashboard", "Dashboard", () => import("./src/pages/Dashboard.tsx")],
  ["/dashboard (guard)", "Dashboard+RequireAuth", async () => ({ default: GuardedDashboard })],
  ["/staff", "Staff", () => import("./src/pages/Staff.tsx")],
  ["/staff (guard)", "Staff+RequireAuth", async () => ({ default: GuardedStaff })],
  ["/platform-info", "PlatformInfo", () => import("./src/pages/PlatformInfo.tsx")],
  ["/nope", "NotFound", () => import("./src/pages/NotFound.tsx")],
];

const failures: string[] = [];

for (const [path, name, load] of routes) {
  try {
    const mod = (await load()) as { default?: React.ComponentType };
    const Page = mod.default;
    if (typeof Page !== "function") throw new Error("no default export component");
    const html = renderToString(
      <ConvexAuthProvider client={client}>
        <ConvexProvider client={client}>
          <MemoryRouter initialEntries={[path]}>
            <Page />
          </MemoryRouter>
        </ConvexProvider>
      </ConvexAuthProvider>,
    );
    if (html.length < 80) throw new Error(`suspiciously short output (${html.length} chars)`);
    if (name === "Dashboard+RequireAuth" || name === "Staff+RequireAuth") {
      const state = html.includes("Sign in to continue")
        ? "sign-in gate"
        : html.includes("animate-spin")
          ? "loading spinner (auth resolves client-side)"
          : "unrecognised guard state";
      console.log(`      guard state -> ${state}`);
    }
    console.log(`PASS  ${path.padEnd(22)} ${name.padEnd(18)} ${String(html.length).padStart(6)} chars`);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}` : String(error);
    failures.push(`${name} (${path}): ${message}`);
    console.log(`FAIL  ${path.padEnd(22)} ${name.padEnd(18)} ${message.slice(0, 140)}`);
  }
}

console.log(`\n${routes.length - failures.length}/${routes.length} pages rendered`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(` - ${failure}`);
  process.exit(1);
}
