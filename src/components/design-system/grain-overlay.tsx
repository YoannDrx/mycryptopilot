import { cn } from "@/lib/utils";

type GrainOverlayProps = {
  className?: string;
  opacity?: number;
};

export function GrainOverlay({ className, opacity = 0.04 }: GrainOverlayProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[1]", className)}
      aria-hidden="true"
      style={{ opacity }}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
