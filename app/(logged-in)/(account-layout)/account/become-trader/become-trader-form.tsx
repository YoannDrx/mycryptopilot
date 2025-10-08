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
      priceMonthlyUSD: 0,
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
      toast.success("Profil trader créé avec succès !");
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
              <FormLabel>Photo de profil (optionnel)</FormLabel>
              <FormControl>
                <ImageFormItem
                  className="size-32 rounded-full"
                  onChange={(url) => form.setValue("image", url)}
                  imageUrl={form.watch("image")}
                />
              </FormControl>
              <FormDescription>
                Téléchargez une image de profil (PNG, JPG - max 1MB)
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
              <FormLabel>Nom d&apos;affichage *</FormLabel>
              <FormControl>
                <Input
                  placeholder="ex: CryptoMaster"
                  {...field}
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                Ce nom sera visible sur votre profil public (3-50 caractères)
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
              <FormLabel>Bio (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre expérience et stratégie de trading..."
                  className="min-h-24"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Présentez-vous à vos futurs followers (max 500 caractères)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price Monthly USD */}
        <FormField
          control={form.control}
          name="priceMonthlyUSD"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix mensuel (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  placeholder="0"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Laissez 0 pour un profil gratuit, ou définissez un prix pour
                monétiser vos signaux
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
          Créer mon profil trader
        </LoadingButton>
      </div>
    </Form>
  );
};
