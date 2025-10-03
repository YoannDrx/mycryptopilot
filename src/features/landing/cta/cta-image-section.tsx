import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { SectionLayout } from "../section-layout";

export const CTAImageSection = () => {
  return (
    <div
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=2000&auto=format&fit=crop)",
        backgroundSize: "cover",
      }}
    >
      <SectionLayout
        variant="image"
        className="flex min-h-[500px] flex-col items-center justify-center gap-4 text-white drop-shadow-md"
      >
        <Typography
          variant="h2"
          className="text-center text-5xl font-extrabold"
        >
          Stop trading blindly
        </Typography>
        <Typography className="text-center font-bold">
          Follow verified traders and protect your capital with a risk-first
          approach
        </Typography>
        <Link href="#pricing" className={buttonVariants({ size: "lg" })}>
          Start for free
        </Link>
      </SectionLayout>
    </div>
  );
};
