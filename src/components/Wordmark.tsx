import { useId } from "react";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  label?: string;
  /** "solid" is the blue brand plate; "outline" is a single-colour line version. */
  variant?: "solid" | "outline";
  animated?: boolean;
};

/**
 * The OpenWorlds mark as inline SVG so the globe can draw itself on arrival and
 * drift slowly afterwards. Geometry matches src/assets/logo.svg.
 */
export function Wordmark({ className, label = "OpenWorlds", variant = "solid", animated = true }: WordmarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const plateId = `ow-plate-${uid}`;
  const glintId = `ow-glint-${uid}`;
  const clipId = `ow-clip-${uid}`;
  const outline = variant === "outline";
  const stroke = outline ? "currentColor" : "#ffffff";

  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("ow-mark", outline && "ow-mark--outline", className)}
      role={label ? "img" : "presentation"}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-animated={animated ? "true" : "false"}
    >
      <defs>
        <linearGradient id={plateId} x1="30" y1="20" x2="482" y2="492" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0875D1" />
          <stop offset="1" stopColor="#2686EC" />
        </linearGradient>
        <linearGradient id={glintId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width="512" height="512" rx="96" />
        </clipPath>
      </defs>

      <rect
        className="ow-mark-plate"
        width="512"
        height="512"
        rx="96"
        fill={outline ? "none" : `url(#${plateId})`}
        stroke={outline ? "currentColor" : "none"}
        strokeWidth={outline ? 5 : 0}
      />

      <g clipPath={`url(#${clipId})`}>
        <rect className="ow-mark-glint" x="-200" y="-64" width="200" height="640" fill={`url(#${glintId})`} />
      </g>

      <circle
        className="ow-mark-rim"
        cx="256"
        cy="256"
        r="154"
        fill="none"
        stroke={stroke}
        strokeWidth="24"
        pathLength={100}
      />
      <path
        className="ow-mark-equator"
        d="M102 256h308"
        fill="none"
        stroke={stroke}
        strokeWidth="22"
        strokeLinecap="round"
        pathLength={100}
      />
      <g className="ow-mark-globe">
        <path
          className="ow-mark-meridian"
          d="M256 102c43 42 65 94 65 154s-22 112-65 154m0-308c-43 42-65 94-65 154s22 112 65 154"
          fill="none"
          stroke={stroke}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
        />
      </g>
    </svg>
  );
}
