"use client";

import { Button } from "@/components/ui/button";
import type { ReviewPageConfig } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";

type Props = {
  config: ReviewPageConfig;
};

export function ThanksStep({ config }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
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

      <Button
        type="button"
        size="lg"
        className="w-full"
        style={{
          backgroundColor: config.primaryColor,
          color: config.backgroundColor,
        }}
        onClick={() => {
          window.close();
        }}
      >
        {config.thanks.ctaLabel}
      </Button>
    </div>
  );
}
