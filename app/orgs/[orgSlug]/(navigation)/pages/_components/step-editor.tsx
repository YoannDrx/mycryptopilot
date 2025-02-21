"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormUnsavedBar } from "@/features/form/form-unsaved-bar";
import { type UseFormReturn } from "react-hook-form";
import { type ReviewPageConfig } from "../_schema/page-config.schema";

type Props = {
  form: UseFormReturn<ReviewPageConfig>;
  onSave: (data: ReviewPageConfig) => Promise<void>;
  selectedStep: keyof ReviewPageConfig | "theme";
  onStepSelect: (step: keyof ReviewPageConfig | "theme") => void;
};

const steps: {
  id: keyof ReviewPageConfig | "theme";
  label: string;
}[] = [
  { id: "intro", label: "Introduction" },
  { id: "review", label: "Review" },
  { id: "info", label: "Information" },
  { id: "thanks", label: "Thank You" },
];

export function StepEditor({
  form,
  selectedStep,
  onStepSelect,
  onSave,
}: Props) {
  return (
    <FormUnsavedBar form={form} onSubmit={async (data) => onSave(data)}>
      <Accordion
        type="single"
        value={selectedStep}
        onValueChange={(value) =>
          onStepSelect(value as keyof ReviewPageConfig | "theme")
        }
      >
        {steps.map((step) => (
          <AccordionItem key={step.id} value={step.id}>
            <AccordionTrigger>{step.label}</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {step.id === "intro" && <IntroStepFields form={form} />}
              {step.id === "review" && <ReviewStepFields form={form} />}
              {step.id === "info" && <InfoStepFields form={form} />}
              {step.id === "thanks" && <ThanksStepFields form={form} />}
            </AccordionContent>
          </AccordionItem>
        ))}

        <AccordionItem value="theme">
          <AccordionTrigger>Theme</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </FormUnsavedBar>
  );
}

function IntroStepFields({ form }: { form: UseFormReturn<ReviewPageConfig> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="intro.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="intro.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="intro.videoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Video URL (optional)</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="intro.ctaLabel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Button Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function ReviewStepFields({ form }: { form: UseFormReturn<ReviewPageConfig> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="review.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="review.helpText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Help Text</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="review.allowVideoReview"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormLabel>Allow Video Reviews</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="review.ctaLabelNext"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Next Button Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function InfoStepFields({ form }: { form: UseFormReturn<ReviewPageConfig> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="info.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="info.helpText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="info.ctaLabelNext"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Next Button Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function ThanksStepFields({ form }: { form: UseFormReturn<ReviewPageConfig> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="thanks.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="thanks.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="thanks.ctaLabel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Button Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
