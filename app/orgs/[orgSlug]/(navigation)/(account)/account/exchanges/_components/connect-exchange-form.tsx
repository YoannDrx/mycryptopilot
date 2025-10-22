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
import { LoadingButton } from "@/features/form/submit-button";
import { ConnectExchangeSchema } from "@/features/exchange/exchange.schema";
import type { ConnectExchangeInput } from "@/features/exchange/exchange.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { upfetch } from "@/lib/up-fetch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type ConnectExchangeFormProps = {
  onSuccess?: () => void;
};

export const ConnectExchangeForm = ({
  onSuccess,
}: ConnectExchangeFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useZodForm({
    schema: ConnectExchangeSchema,
    defaultValues: {
      exchange: "BINANCE",
      apiKey: "",
      secretKey: "",
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (values: ConnectExchangeInput) => {
      // upfetch automatically parses JSON and throws on error (status >= 400)
      const data = await upfetch("/api/exchange/connect", {
        method: "POST",
        body: JSON.stringify(values),
      });

      return data;
    },
    onSuccess: async (data) => {
      toast.success(
        data.message ?? "Exchange connected successfully! Syncing trades...",
      );
      form.reset();
      await queryClient.invalidateQueries({
        queryKey: ["exchange-connections"],
      });
      // Refresh Server Component data to update connection count
      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-4">
      {/* Security Alert */}
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertDescription>
          <strong>Read-only keys required.</strong> We never request trading
          permissions. Your API keys are encrypted with AES-256-GCM before
          storage.
        </AlertDescription>
      </Alert>

      {/* How to get API keys */}
      <Alert>
        <Link2 className="size-4" />
        <AlertDescription>
          <strong>How to get Binance API keys:</strong>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
            <li>
              Go to{" "}
              <a
                href="https://www.binance.com/en/my/settings/api-management"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Binance API Management
              </a>
            </li>
            <li>Create a new API key (System Generated recommended)</li>
            <li>
              <strong>Enable only &quot;Enable Reading&quot; permission</strong>
            </li>
            <li>Save your API Key and Secret Key</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Form
        form={form}
        onSubmit={async (values) => connectMutation.mutateAsync(values)}
        disabled={connectMutation.isPending}
      >
        <div className="flex flex-col gap-6">
          {/* Exchange Selector (Fixed to BINANCE for now) */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                <span className="text-2xl">🟡</span>
              </div>
              <div>
                <p className="font-semibold">Binance</p>
                <p className="text-muted-foreground text-sm">
                  Spot & Futures trading data
                </p>
              </div>
            </div>
          </div>

          {/* API Key */}
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your Binance API Key"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your read-only API key from Binance
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Secret Key */}
          <FormField
            control={form.control}
            name="secretKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secret Key *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your Binance Secret Key"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your secret key (never shared or exposed)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Error Display */}
          {connectMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                {connectMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            loading={connectMutation.isPending}
            className="w-full"
          >
            {connectMutation.isPending
              ? "Validating & Connecting..."
              : "Connect Exchange"}
          </LoadingButton>
        </div>
      </Form>
    </div>
  );
};
