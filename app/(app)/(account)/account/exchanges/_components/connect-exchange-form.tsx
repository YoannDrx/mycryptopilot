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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/features/form/submit-button";
import { ConnectExchangeSchema } from "@/features/exchange/exchange.schema";
import type { ConnectExchangeInput } from "@/features/exchange/exchange.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { upfetch } from "@/lib/up-fetch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { isResponseError } from "up-fetch";

type ConnectExchangeFormProps = {
  onSuccess?: () => void;
};

const exchangeDisplayName: Record<"BINANCE" | "BYBIT", string> = {
  BINANCE: "Binance",
  BYBIT: "Bybit",
};

const getExchangeConnectionError = (error: unknown) => {
  if (
    isResponseError(error) &&
    typeof error.data === "object" &&
    error.data !== null &&
    "error" in error.data &&
    typeof error.data.error === "string"
  ) {
    return error.data.error;
  }

  return error instanceof Error
    ? error.message
    : "The exchange connection could not be validated. Please try again.";
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

      // Invalidate connection stats (will be fetched for new connection)
      await queryClient.invalidateQueries({
        queryKey: ["exchange-status"],
      });

      // Refresh Server Component to show new connection in list
      router.refresh();

      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getExchangeConnectionError(error));
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

      <Form
        form={form}
        onSubmit={async (values) => connectMutation.mutateAsync(values)}
        disabled={connectMutation.isPending}
      >
        <div className="flex flex-col gap-6">
          {/* Exchange Selector */}
          <FormField
            control={form.control}
            name="exchange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Exchange *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-4"
                  >
                    {/* Binance Option */}
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                      <RadioGroupItem value="BINANCE" id="binance" />
                      <Label
                        htmlFor="binance"
                        className="flex flex-1 cursor-pointer items-center gap-3"
                      >
                        <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                          <span className="text-2xl">🟡</span>
                        </div>
                        <div>
                          <p className="font-semibold">Binance</p>
                          <p className="text-muted-foreground text-sm">
                            Spot & Futures trading data
                          </p>
                        </div>
                      </Label>
                    </div>

                    {/* Bybit Option */}
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                      <RadioGroupItem value="BYBIT" id="bybit" />
                      <Label
                        htmlFor="bybit"
                        className="flex flex-1 cursor-pointer items-center gap-3"
                      >
                        <div className="flex size-12 items-center justify-center rounded-lg bg-orange-500/10">
                          <span className="text-2xl">🟠</span>
                        </div>
                        <div>
                          <p className="font-semibold">Bybit</p>
                          <p className="text-muted-foreground text-sm">
                            Spot & Futures trading data
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instructions Binance */}
          {form.watch("exchange") === "BINANCE" && (
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
                    <strong>
                      Enable only &quot;Enable Reading&quot; permission
                    </strong>
                  </li>
                  <li>Save your API Key and Secret Key</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions Bybit */}
          {form.watch("exchange") === "BYBIT" && (
            <Alert>
              <Link2 className="size-4" />
              <AlertDescription>
                <strong>How to get Bybit API keys:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                  <li>
                    Go to{" "}
                    <a
                      href="https://www.bybit.com/app/user/api-management"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Bybit API Management
                    </a>
                  </li>
                  <li>Click &quot;Create New Key&quot;</li>
                  <li>
                    <strong>
                      Select &quot;Read-Only&quot; permissions only
                    </strong>
                  </li>
                  <li>Save your API Key and Secret Key</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* API Key */}
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => {
              const exchangeValue = form.watch(
                "exchange",
              ) as keyof typeof exchangeDisplayName;
              const exchangeLabel = exchangeDisplayName[exchangeValue];
              return (
                <FormItem>
                  <FormLabel>API Key *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={`Enter your ${exchangeLabel} API Key`}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your read-only API key from {exchangeLabel}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Secret Key */}
          <FormField
            control={form.control}
            name="secretKey"
            render={({ field }) => {
              const exchangeValue = form.watch(
                "exchange",
              ) as keyof typeof exchangeDisplayName;
              const exchangeLabel = exchangeDisplayName[exchangeValue];
              return (
                <FormItem>
                  <FormLabel>Secret Key *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={`Enter your ${exchangeLabel} Secret Key`}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your secret key (never shared or exposed)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Error Display */}
          {connectMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                {getExchangeConnectionError(connectMutation.error)}
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
