"use client";

import { animate } from "motion/react";
import { useEffect, useRef } from "react";
import { SectionLayout } from "./section-layout";

type StatProps = {
  number: number;
  suffix: string;
  text: string;
};

const stats: StatProps[] = [
  {
    number: 2.8,
    suffix: "K+",
    text: "Trading signals sent every month",
  },
  {
    number: 58,
    suffix: "%",
    text: "Average win rate of our verified traders",
  },
  {
    number: 12,
    suffix: "",
    text: "Active and verified professional traders",
  },
  {
    number: 420,
    suffix: "+",
    text: "Traders who trust us",
  },
];

export function StatsSection() {
  return (
    <SectionLayout size="sm">
      <div className="grid w-full items-center gap-12 sm:grid-cols-2 md:-mx-5 md:max-w-none md:grid-cols-4 md:gap-0">
        {stats.map((stat, index) => (
          <div key={index} className="relative text-center md:px-5">
            <h4 className="mb-2 text-2xl font-bold tabular-nums md:text-3xl">
              <Counter from={0} to={stat.number} />

              {stat.suffix}
            </h4>
            <p className="text-muted-foreground text-sm">{stat.text}</p>
          </div>
        ))}
      </div>
    </SectionLayout>
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

  useEffect(() => {
    if (!nodeRef.current) return;
    const node = nodeRef.current;

    const controls = animate(from, to, {
      duration,
      ease: "easeInOut",

      onUpdate(value) {
        node.textContent = value.toFixed(2);
      },
    });

    return () => controls.stop();
  }, [from, to, duration]);

  return <span ref={nodeRef}>{from}</span>;
}
