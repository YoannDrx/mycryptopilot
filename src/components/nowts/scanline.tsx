import { cn } from "@/lib/utils";

export type ScanlineProps = {
  className?: string;
  color?: "emerald" | "crimson";
  speed?: "slow" | "normal" | "fast";
};

export const Scanline = ({
  className,
  color = "emerald",
  speed = "normal",
}: ScanlineProps) => {
  const colorClass =
    color === "emerald"
      ? "from-transparent via-[#00ffaa] to-transparent"
      : "from-transparent via-[#ff3366] to-transparent";

  const speedClass =
    speed === "slow"
      ? "[animation-duration:10s]"
      : speed === "fast"
        ? "[animation-duration:3s]"
        : "[animation-duration:6s]";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-0 h-[2px] w-full animate-[scan_6s_linear_infinite] bg-gradient-to-r opacity-40",
          colorClass,
          speedClass,
        )}
        style={{
          animation: `scan ${speed === "slow" ? "10s" : speed === "fast" ? "3s" : "6s"} linear infinite`,
        }}
      />
    </div>
  );
};
