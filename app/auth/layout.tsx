import type { PropsWithChildren } from "react";

const SQUARE_SIZE = 20;
const SQUARE_COLOR = "color-mix(in srgb, var(--muted) 50%, transparent)";

export default function RouteLayout(props: PropsWithChildren) {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent ${SQUARE_SIZE}px, ${SQUARE_COLOR} ${SQUARE_SIZE}px, ${SQUARE_COLOR} ${SQUARE_SIZE + 0.5}px, transparent ${SQUARE_SIZE + 0.5}px, transparent ${SQUARE_SIZE * 2}px), repeating-linear-gradient(90deg, transparent 0, transparent ${SQUARE_SIZE}px, ${SQUARE_COLOR} ${SQUARE_SIZE}px, ${SQUARE_COLOR} ${SQUARE_SIZE + 0.5}px, transparent ${SQUARE_SIZE + 0.5}px, transparent ${SQUARE_SIZE * 2}px)`,
        }}
      />
      {props.children}
    </div>
  );
}
