"use client";

import { BentoGrid, BentoGridItem } from "@/components/nowts/bentoo";
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
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { SectionLayout } from "./section-layout";

export function BentoGridSection() {
  return (
    <SectionLayout>
      <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn("[&>p:text-lg]", item.className)}
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
      <motion.div className="border-border bg-background flex flex-col gap-2 rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <Typography variant="small" className="font-semibold">
            BTC/USDT PERP
          </Typography>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            LONG
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Entry</p>
            <p className="font-semibold text-green-500">$42,150</p>
          </div>
          <div>
            <p className="text-muted-foreground">TP1</p>
            <p className="font-semibold text-green-500">$43,200</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        variants={variants}
        className="border-border bg-background flex flex-col gap-1 rounded-2xl border p-3"
      >
        <p className="text-xs font-medium">Risk: 2/5 • Confidence: 78%</p>
        <p className="text-muted-foreground text-xs">
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
        <Alert variant="default" className="">
          <Loader size={20} />
          <AlertTitle>Calculating position sizing...</AlertTitle>
        </Alert>
      </motion.div>
      <motion.div variants={variants}>
        <Alert variant="success" className="">
          <CheckCircle size={20} />
          <AlertTitle>Recommended size: $850 (2% risk, R:R 1:3)</AlertTitle>
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
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex size-full min-h-24 flex-1 flex-col space-y-2 rounded-lg"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="size-full rounded-lg"></motion.div>
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
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">58%</Typography>
        <Typography variant={"muted"}>Win Rate</Typography>
        <Typography variant={"muted"} className="text-green-500">
          +4% this month
        </Typography>
      </motion.div>
      <motion.div className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4">
        <Typography variant="large">2.4</Typography>
        <Typography variant={"muted"}>Payoff Ratio</Typography>
        <Typography variant={"muted"} className="text-green-500">
          Excellent
        </Typography>
      </motion.div>
      <motion.div
        variants={second}
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">-12%</Typography>
        <Typography variant={"muted"}>Max Drawdown</Typography>
        <Typography variant={"muted"} className="text-green-500">
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
        className="border-border bg-background flex flex-row items-center gap-3 rounded-2xl border p-3"
      >
        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
          <TrendingUp className="text-primary size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">CryptoMaster_BTC</p>
          <p className="text-muted-foreground text-xs">
            Win Rate: 62% • 847 followers
          </p>
        </div>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="border-border bg-background flex flex-row items-center gap-3 rounded-2xl border p-3"
      >
        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
          <TrendingUp className="text-primary size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">AltcoinPro_Trading</p>
          <p className="text-muted-foreground text-xs">
            Win Rate: 59% • 623 followers
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
