import { badgeLabel, type PublicBadge } from "@/lib/staff";

const styles: Record<PublicBadge, string> = {
  staff: "text-[#0052a3]",
  dev: "text-[#7651c9]",
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
      className={`text-xs font-medium ${styles[badge]} ${className}`}
    >
      {badgeLabel(badge)}
    </span>
  );
}
