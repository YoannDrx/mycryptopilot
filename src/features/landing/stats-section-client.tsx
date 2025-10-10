"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

type StatProps = {
  number: number;
  suffix: string;
  text: string;
};

export function StatsClient({ stat }: { stat: StatProps }) {
  return (
    <div className="relative text-center md:px-5">
      <h4 className="mb-2 text-2xl font-bold tabular-nums md:text-3xl">
        <Counter from={0} to={stat.number} />
        {stat.suffix}
      </h4>
      <p className="text-muted-foreground text-sm">{stat.text}</p>
    </div>
  );
}

function Counter({
  from,
  to,
  duration = 2,
}: {
  from: number;
  to: number;
  duration?: number;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !nodeRef.current) return;
    const node = nodeRef.current;

    const controls = animate(from, to, {
      duration,
      ease: "easeInOut",

      onUpdate(value: number) {
        node.textContent = value.toFixed(2);
      },
    });

    return () => controls.stop();
  }, [from, to, duration, isMounted]);

  return <span ref={nodeRef}>{to.toFixed(2)}</span>;
}
