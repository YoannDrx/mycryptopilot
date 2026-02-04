"use client";

import { BentoGrid, BentoGridItem } from "@/components/nowts/bentoo";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/nowts/loader";
import { Typography } from "@/components/nowts/typography";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle,
  Target,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { SectionLayout } from "./section-layout";

export function BentoGridSection() {
  return (
    <SectionLayout size="lg" id="features">
      <div className="mb-12 text-center">
        <Badge variant="emerald" className="mb-4">
          <Sparkles className="mr-1 size-3" />
          Features
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tout Ce Dont Vous Avez <span className="text-[#00ffaa]">Besoin</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          Une plateforme complète pour recevoir des signaux, gérer vos risques
          et tracker vos performances.
        </p>
      </div>
      <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn(
              "[&>p:text-lg] border-[var(--glass-border)] bg-[var(--bg-onyx)] transition-all duration-300 hover:border-[#00ffaa]/30 hover:shadow-[0_0_20px_rgba(0,255,170,0.05)]",
              item.className,
            )}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </SectionLayout>
  );
}

const Skeleton1 = () => {
  const variants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div className="flex flex-col gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4">
        <div className="flex items-center justify-between">
          <Typography variant="small" className="font-semibold text-white">
            BTC/USDT PERP
          </Typography>
          <span className="rounded-full bg-[#00ffaa]/10 px-2 py-1 text-xs font-medium text-[#00ffaa]">
            LONG
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[var(--text-muted)]">Entry</p>
            <p className="font-semibold text-[#00ffaa]">$42,150</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">TP1</p>
            <p className="font-semibold text-[#00ffaa]">$43,200</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-col gap-1 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3"
      >
        <p className="text-xs font-medium text-white">
          Risk: 2/5 • Confidence: 78%
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Bullish formation + key support
        </p>
      </motion.div>
    </motion.div>
  );
};

const Skeleton2 = () => {
  const variants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
  };
  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div>
        <Alert
          variant="default"
          className="border-[var(--glass-border)] bg-[var(--bg-graphite)]"
        >
          <Loader size={20} />
          <AlertTitle className="text-white">
            Calculating position sizing...
          </AlertTitle>
        </Alert>
      </motion.div>
      <motion.div variants={variants}>
        <Alert
          variant="success"
          className="border-[#00ffaa]/30 bg-[#00ffaa]/10"
        >
          <CheckCircle size={20} className="text-[#00ffaa]" />
          <AlertTitle className="text-[#00ffaa]">
            Recommended size: $850 (2% risk, R:R 1:3)
          </AlertTitle>
        </Alert>
      </motion.div>
    </motion.div>
  );
};
const Skeleton3 = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex size-full min-h-24 flex-1 flex-col space-y-2 rounded-xl"
      style={{
        background:
          "linear-gradient(-45deg, #00ffaa, #00d4ff, #00ffaa, #ff3366)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="size-full rounded-xl" />
    </motion.div>
  );
};
const Skeleton4 = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 flex-row gap-4"
    >
      <motion.div
        variants={first}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4"
      >
        <Typography variant="large" className="text-[#00ffaa]">
          58%
        </Typography>
        <Typography variant={"muted"} className="text-[var(--text-muted)]">
          Win Rate
        </Typography>
        <Typography variant={"muted"} className="text-[#00ffaa]">
          +4% this month
        </Typography>
      </motion.div>
      <motion.div className="flex h-full w-1/3 flex-col items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4">
        <Typography variant="large" className="text-[#00d4ff]">
          2.4
        </Typography>
        <Typography variant={"muted"} className="text-[var(--text-muted)]">
          Payoff Ratio
        </Typography>
        <Typography variant={"muted"} className="text-[#00ffaa]">
          Excellent
        </Typography>
      </motion.div>
      <motion.div
        variants={second}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4"
      >
        <Typography variant="large" className="text-[#ff3366]">
          -12%
        </Typography>
        <Typography variant={"muted"} className="text-[var(--text-muted)]">
          Max Drawdown
        </Typography>
        <Typography variant={"muted"} className="text-[#00ffaa]">
          Controlled risk
        </Typography>
      </motion.div>
    </motion.div>
  );
};

const Skeleton5 = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-col gap-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00ffaa]/10">
          <TrendingUp className="size-5 text-[#00ffaa]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">CryptoMaster_BTC</p>
          <p className="text-xs text-[var(--text-muted)]">
            Win Rate: <span className="text-[#00ffaa]">62%</span> • 847
            followers
          </p>
        </div>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00d4ff]/10">
          <TrendingUp className="size-5 text-[#00d4ff]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">AltcoinPro_Trading</p>
          <p className="text-xs text-[var(--text-muted)]">
            Win Rate: <span className="text-[#00d4ff]">59%</span> • 623
            followers
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const items = [
  {
    title: "Signal Cards",
    description: (
      <span className="text-sm">
        Receive structured trading signals with entry, take-profit, stop-loss
        and detailed rationales.
      </span>
    ),
    header: <Skeleton1 />,
    className: "md:col-span-1",
    icon: <Target size={20} />,
  },
  {
    title: "Risk Console",
    description: (
      <span className="text-sm">
        Automatically calculate the ideal position size based on your capital
        and risk tolerance.
      </span>
    ),
    header: <Skeleton2 />,
    className: "md:col-span-1",
    icon: <Calculator size={20} />,
  },
  {
    title: "Trading Journal",
    description: (
      <span className="text-sm">
        Track your performance, identify mistakes and improve your strategy over
        time.
      </span>
    ),
    header: <Skeleton3 />,
    className: "md:col-span-1",
    icon: <BookOpen size={20} />,
  },
  {
    title: "Transparent Stats",
    description: (
      <span className="text-sm">
        View the real win rate, payoff ratio and max drawdown of each verified
        trader.
      </span>
    ),
    header: <Skeleton4 />,
    className: "md:col-span-2",
    icon: <BarChart3 size={20} />,
  },

  {
    title: "Traders Marketplace",
    description: (
      <span className="text-sm">
        Discover and follow the best verified crypto traders based on your risk
        criteria.
      </span>
    ),
    header: <Skeleton5 />,
    className: "md:col-span-1",
    icon: <Users size={20} />,
  },
];
