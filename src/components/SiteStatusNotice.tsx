import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, Construction } from "lucide-react";

export function SiteStatusNotice() {
  const status = useQuery(api.siteStatus.publicStatus);
  if (!status || status === "available") return null;

  const isUnavailable = status === "unavailable";
  const Icon = isUnavailable ? AlertTriangle : Construction;
  const message = isUnavailable
    ? "OpenWorlds is temporarily unavailable. Please check back later."
    : "OpenWorlds is under construction. Some parts of the site may be unavailable.";

  return (
    <div role="status" className={`flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium ${isUnavailable ? "bg-amber-100 text-amber-950" : "bg-sky-100 text-sky-950"}`}>
      <Icon className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
