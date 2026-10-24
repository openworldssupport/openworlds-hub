import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle } from "lucide-react";

export function SiteStatusNotice() {
  const status = useQuery(api.siteStatus.publicStatus);
  if (!status || status === "available") return null;

  const message = "The site is currently unavailable while we carry out maintenance or construction. Please check back later.";

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <AlertTriangle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
