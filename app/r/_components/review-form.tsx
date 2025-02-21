"use client";

import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getOptimalTextColor, hexToHsl, hslToString } from "@/lib/color";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { ReviewPageConfig } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";
import { submitReviewAction } from "../_actions/submit-review.action";
import {
  type ReviewFormSchemaType,
  type ReviewInfoSchemaType,
  type ReviewTextSchemaType,
} from "../_schema/review.schema";
import { InfoStep } from "./info-step";
import { IntroStep } from "./intro-step";
import { ReviewStep } from "./review-step";
import { ThanksStep } from "./thanks-step";

type Props = {
  config: ReviewPageConfig;
  pageId: string;
};

type Step = "intro" | "review" | "info" | "thanks";

export function ReviewForm({ config, pageId }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [formData, setFormData] = useState<Partial<ReviewFormSchemaType>>({});

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormSchemaType) => {
      return resolveActionResult(
        submitReviewAction({
          pageId,
          data,
        }),
      );
    },
    onSuccess: () => {
      setStep("thanks");
    },
  });

  const handleReviewSubmit = (data: ReviewTextSchemaType) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("info");
  };

  const handleInfoSubmit = (data: ReviewInfoSchemaType) => {
    const finalData = { ...formData, ...data };
    mutation.mutate(finalData as ReviewFormSchemaType);
  };

  const primaryHsl = hexToHsl(config.primaryColor);
  const backgroundHsl = hexToHsl(config.backgroundColor);
  const cardHsl = {
    h: backgroundHsl.h,
    l: backgroundHsl.l > 50 ? backgroundHsl.l - 3 : backgroundHsl.l + 3,
    s: backgroundHsl.s,
  };

  const foregroundColor = getOptimalTextColor(backgroundHsl);
  const primaryForegroundColor = getOptimalTextColor(primaryHsl);

  return (
    <div
      className="min-h-screen w-full"
      style={
        {
          "--primary": hslToString(primaryHsl),
          "--background": hslToString(backgroundHsl),
          "--accent": hslToString(cardHsl),
          "--border": hslToString(cardHsl),
          "--input": hslToString(cardHsl),
          "--ring": hslToString(primaryHsl),
          "--foreground": hslToString(foregroundColor),
          "--primary-foreground": hslToString(primaryForegroundColor),
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
        {step === "intro" && (
          <IntroStep
            config={config}
            onSubmit={() => setStep("review")}
            isLoading={mutation.isPending}
          />
        )}
        {step === "review" && (
          <ReviewStep
            config={config}
            onSubmit={handleReviewSubmit}
            isLoading={mutation.isPending}
          />
        )}
        {step === "info" && (
          <InfoStep
            config={config}
            onSubmit={handleInfoSubmit}
            isLoading={mutation.isPending}
          />
        )}
        {step === "thanks" && <ThanksStep config={config} />}
      </div>
    </div>
  );
}
