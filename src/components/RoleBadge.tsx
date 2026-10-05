import { badgeLabel, type PublicBadge } from "@/lib/staff";

const styles: Record<PublicBadge, string> = {
  staff: "border-blue-200 bg-blue-50 text-[#0052a3]",
  dev: "border-violet-200 bg-violet-50 text-[#7651c9]",
};

/**
 * The public "Staff" / "Dev" tag. Used on the site nav, the About team list,
 * the admin panel and the staff portal so the badge always looks the same.
 */
export function RoleBadge({
  badge,
  className = "",
}: {
  badge: PublicBadge;
  className?: string;
}) {
  return (
    <span
      title={badge === "dev" ? "OpenWorlds development team" : "OpenWorlds staff"}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[badge]} ${className}`}
    >
      {badgeLabel(badge)}
    </span>
  );
}
