import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "icon" | "mono";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: { icon: 24, text: "text-base" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 40, text: "text-xl" },
  xl: { icon: 48, text: "text-2xl" },
};

function LogoIcon({ size, mono = false }: { size: number; mono?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Hexagon outer glow */}
      <defs>
        <linearGradient
          id="emerald-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={mono ? "currentColor" : "#00ffaa"} />
          <stop offset="100%" stopColor={mono ? "currentColor" : "#00d4ff"} />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main hexagon */}
      <path
        d="M24 4L42.5 14V34L24 44L5.5 34V14L24 4Z"
        stroke="url(#emerald-gradient)"
        strokeWidth="2"
        fill="none"
        filter="url(#glow)"
      />

      {/* Inner hexagon */}
      <path
        d="M24 12L34 18V30L24 36L14 30V18L24 12Z"
        stroke={mono ? "currentColor" : "#00ffaa"}
        strokeWidth="1.5"
        fill={mono ? "none" : "rgba(0, 255, 170, 0.1)"}
        opacity="0.8"
      />

      {/* Arrow pointing up-right (pilot direction) */}
      <path
        d="M20 28L24 20L28 24"
        stroke={mono ? "currentColor" : "#00ffaa"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M24 20L30 20L30 26"
        stroke={mono ? "currentColor" : "#00ffaa"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Small crypto dots */}
      <circle
        cx="12"
        cy="24"
        r="2"
        fill={mono ? "currentColor" : "#00ffaa"}
        opacity="0.6"
      />
      <circle
        cx="36"
        cy="24"
        r="2"
        fill={mono ? "currentColor" : "#ff3366"}
        opacity="0.6"
      />
    </svg>
  );
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const { icon, text } = sizes[size];
  const isMono = variant === "mono";

  if (variant === "icon" || variant === "mono") {
    return (
      <div className={cn("inline-flex", className)}>
        <LogoIcon size={icon} mono={isMono} />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LogoIcon size={icon} />
      <span className={cn("font-semibold tracking-tight", text)}>
        <span className="text-foreground">MyCrypto</span>
        <span className="text-primary">Pilot</span>
      </span>
    </div>
  );
}
