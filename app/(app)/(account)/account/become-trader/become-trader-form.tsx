"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import { ImageFormItem } from "@/features/images/image-form-item";
import { createTraderProfileAction } from "@/features/trader/trader.action";
import {
  CreateTraderProfileSchema,
  type CreateTraderProfileType,
} from "@/features/trader/trader.schema";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const BecomeTraderForm = () => {
  const router = useRouter();

  const form = useZodForm({
    schema: CreateTraderProfileSchema,
    defaultValues: {
      displayName: "",
      bio: "",
      image: null,
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (values: CreateTraderProfileType) => {
      const result = await createTraderProfileAction(values);

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to create profile");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Trader profile created successfully!");
      router.push("/account");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form
      form={form}
      onSubmit={async (values) => createProfileMutation.mutateAsync(values)}
      disabled={createProfileMutation.isPending}
    >
      <div className="flex flex-col gap-6">
        {/* Avatar Upload */}
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Profile Picture (optional)</FormLabel>
              <FormControl>
                <ImageFormItem
                  className="size-32 rounded-full"
                  onChange={(url) => form.setValue("image", url)}
                  imageUrl={form.watch("image")}
                />
              </FormControl>
              <FormDescription>
                Upload a profile image (PNG, JPG - max 1MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display Name */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g: CryptoMaster"
                  {...field}
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                This name will be visible on your public profile (3-50
                characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your trading experience and strategy..."
                  className="min-h-24"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Introduce yourself to your future followers (max 500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <LoadingButton
          type="submit"
          loading={createProfileMutation.isPending}
          className="w-full"
        >
          Create my trader profile
        </LoadingButton>
      </div>
    </Form>
  );
};
