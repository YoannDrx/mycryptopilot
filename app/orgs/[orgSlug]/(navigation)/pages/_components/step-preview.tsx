"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type ReviewPageConfig } from "../_schema/page-config.schema";

type Props = {
  config: ReviewPageConfig;
  step: keyof ReviewPageConfig | "theme";
};

export function StepPreview({ config, step }: Props) {
  // Always show intro when theme is selected
  const displayStep = step === "theme" ? "intro" : step;

  return (
    <div
      className="min-h-[600px] p-8"
      style={{
        backgroundColor: config.backgroundColor,
      }}
    >
      <div className="mx-auto max-w-2xl">
        {displayStep === "intro" && <IntroStep config={config} />}
        {displayStep === "review" && <ReviewStep config={config} />}
        {displayStep === "info" && <InfoStep config={config} />}
        {displayStep === "thanks" && <ThanksStep config={config} />}
      </div>
    </div>
  );
}

function IntroStep({ config }: { config: ReviewPageConfig }) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <h1
          className="text-4xl font-bold"
          style={{ color: config.primaryColor }}
        >
          {config.intro.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {config.intro.description}
        </p>
      </div>

      {config.intro.videoUrl && (
        <div className="aspect-video w-full rounded-lg bg-muted" />
      )}

      <Button
        size="lg"
        className="w-full"
        style={{
          backgroundColor: config.primaryColor,
          color: config.backgroundColor,
        }}
      >
        {config.intro.ctaLabel}
      </Button>
    </div>
  );
}

function ReviewStep({ config }: { config: ReviewPageConfig }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <h1
          className="text-4xl font-bold"
          style={{ color: config.primaryColor }}
        >
          {config.review.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {config.review.helpText}
        </p>
      </div>

      <Textarea
        className="h-32"
        placeholder="Write your review here..."
        disabled
      />

      {config.review.allowVideoReview && (
        <Button
          variant="outline"
          size="lg"
          className={cn("w-full border-2")}
          style={{
            borderColor: config.primaryColor,
            color: config.primaryColor,
          }}
        >
          Record a Video Review
        </Button>
      )}

      <Button
        size="lg"
        className="w-full"
        style={{
          backgroundColor: config.primaryColor,
          color: config.backgroundColor,
        }}
      >
        {config.review.ctaLabelNext}
      </Button>
    </div>
  );
}

function InfoStep({ config }: { config: ReviewPageConfig }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <h1
          className="text-4xl font-bold"
          style={{ color: config.primaryColor }}
        >
          {config.info.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {config.info.description}
        </p>
      </div>

      <div className="space-y-4">
        <Input placeholder="Your Name" disabled />
        <Input placeholder="Your Email" disabled />
        <Input placeholder="Your Role (optional)" disabled />
      </div>

      <Button
        size="lg"
        className="w-full"
        style={{
          backgroundColor: config.primaryColor,
          color: config.backgroundColor,
        }}
      >
        {config.info.ctaLabelNext}
      </Button>
    </div>
  );
}

function ThanksStep({ config }: { config: ReviewPageConfig }) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <h1
          className="text-4xl font-bold"
          style={{ color: config.primaryColor }}
        >
          {config.thanks.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {config.thanks.description}
        </p>
      </div>

      {config.thanks.videoUrl && (
        <div className="aspect-video w-full rounded-lg bg-muted" />
      )}

      <Button
        size="lg"
        className="w-full"
        style={{
          backgroundColor: config.primaryColor,
          color: config.backgroundColor,
        }}
      >
        {config.thanks.ctaLabel}
      </Button>
    </div>
  );
}
