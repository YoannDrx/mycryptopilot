"use client";

import { Card } from "@/components/ui/card";
import { useZodForm } from "@/components/ui/form";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { type ReviewPage } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { updatePageAction } from "../_actions/update-page.action";
import {
  type ReviewPageConfig,
  PageConfigSchema,
} from "../_schema/page-config.schema";
import { StepEditor } from "./step-editor";
import { StepPreview } from "./step-preview";

type Props = {
  page: ReviewPage;
};

export function PageEditor({ page }: Props) {
  const [selectedStep, setSelectedStep] = useState<
    keyof ReviewPageConfig | "theme"
  >("intro");

  const form = useZodForm({
    schema: PageConfigSchema,
    defaultValues: page.config as ReviewPageConfig,
  });

  const config = form.watch();

  const mutation = useMutation({
    mutationFn: async (config: ReviewPageConfig) => {
      return resolveActionResult(
        updatePageAction({
          pageId: page.id,
          config,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="grid grid-cols-2 gap-8">
      <Card className="p-6">
        <StepEditor
          form={form}
          selectedStep={selectedStep}
          onStepSelect={setSelectedStep}
          onSave={async (data) => {
            await mutation.mutateAsync(data);
          }}
        />
      </Card>

      <div className="sticky top-8">
        <Card className="overflow-hidden">
          <StepPreview config={config} step={selectedStep} />
        </Card>
      </div>
    </div>
  );
}
