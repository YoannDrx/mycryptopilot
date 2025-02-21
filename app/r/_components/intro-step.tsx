"use client";

import { Button } from "@/components/ui/button";
import type { ReviewPageConfig } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";

type Props = {
  config: ReviewPageConfig;
  onSubmit: () => void;
  isLoading?: boolean;
};

export function IntroStep({ config, onSubmit, isLoading }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">{config.intro.title}</h1>
        <p className="text-lg text-muted-foreground">
          {config.intro.description}
        </p>
      </div>

      {config.intro.videoUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <video
            src={config.intro.videoUrl}
            className="size-full object-cover"
            controls
          />
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={isLoading}
      >
        {config.intro.ctaLabel}
      </Button>
    </div>
  );
}
