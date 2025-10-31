"use client";

/**
 * CheckoutForm Component
 *
 * Handles crypto payment checkout flow:
 * 1. Generate unique addresses (Base USDC + Tron USDT)
 * 2. Display addresses with QR codes
 * 3. Countdown timer (15 min expiration)
 * 4. Poll payment status every 10s
 * 5. Redirect to dashboard on payment confirmation
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/34
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Countdown from "react-countdown";
import QRCode from "qrcode";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateAddressAction } from "@/lib/actions/crypto/generate-address.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import {
  MYCRYPTOPILOT_PLANS,
  type MyCryptoPilotPlanName,
} from "@/lib/crypto/mycryptopilot-plans";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Timer,
  Wallet,
} from "lucide-react";
import { upfetch } from "@/lib/up-fetch";
import { logger } from "@/lib/logger";
import { TestnetBadge } from "./testnet-badge";
import { SiteConfig } from "@/site-config";
import { TestPaymentSuccessDialog } from "./test-payment-success-dialog";

type CheckoutFormProps = {
  plan: MyCryptoPilotPlanName;
  orgSlug: string;
  isTestnet?: boolean;
};

type GeneratedAddresses = {
  base: {
    id: string;
    address: string;
    network: "BASE";
  };
  tron: {
    id: string;
    address: string;
    network: "TRON";
  };
};

type PaymentStatus = "pending" | "confirmed" | "expired";

export const CheckoutForm = ({
  plan,
  orgSlug,
  isTestnet = false,
}: CheckoutFormProps) => {
  const router = useRouter();
  const planData = MYCRYPTOPILOT_PLANS.find((p) => p.name === plan);

  if (!planData) {
    throw new Error(`Plan ${plan} not found`);
  }

  const [addresses, setAddresses] = useState<GeneratedAddresses | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [qrCodes, setQrCodes] = useState<{
    base: string;
    tron: string;
  } | null>(null);
  const [showTestSuccessDialog, setShowTestSuccessDialog] = useState(false);

  // Generate crypto addresses on mount
  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await generateAddressAction({
        plan: plan as "test" | "pro" | "ultra",
      });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to generate addresses");
      }

      return result.data;
    },
    onSuccess: async (data) => {
      setAddresses(data.addresses);
      setExpiresAt(new Date(data.expiresAt));

      // Generate QR codes
      try {
        const [baseQR, tronQR] = await Promise.all([
          QRCode.toDataURL(data.addresses.base.address, { width: 256 }),
          QRCode.toDataURL(data.addresses.tron.address, { width: 256 }),
        ]);
        setQrCodes({ base: baseQR, tron: tronQR });
      } catch (error) {
        logger.error("Failed to generate QR codes", { error });
        toast.error("Failed to generate QR codes");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Auto-generate addresses on mount
  useEffect(() => {
    if (!generateMutation.isPending && !addresses) {
      generateMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll payment status every 10 seconds
  useEffect(() => {
    if (!addresses || paymentStatus !== "pending") return;

    const checkPaymentStatus = async () => {
      try {
        const result = await upfetch("/api/crypto/check-payment", {
          method: "POST",
          body: {
            baseAddressId: addresses.base.id,
            tronAddressId: addresses.tron.id,
          },
          schema: z.object({
            confirmed: z.boolean(),
            pending: z.boolean().optional(),
            plan: z.string().optional(),
            daysGranted: z.number().optional(),
            periodEnd: z.string().optional(),
            txHash: z.string().optional(),
            error: z.string().optional(),
          }),
        });

        if (result.confirmed) {
          setPaymentStatus("confirmed");

          // For test plan, show success dialog instead of redirecting
          if (plan === "test") {
            toast.success("Test payment confirmed!");
            setShowTestSuccessDialog(true);
          } else {
            // Regular plan: show toast and redirect
            toast.success("Payment confirmed! Activating subscription...");

            // Wait 2s before redirect to show success message
            setTimeout(() => {
              router.push(`/orgs/${orgSlug}/dashboard`);
              router.refresh();
            }, 2000);
          }
        } else if (result.error) {
          logger.error("Payment check error", { error: result.error });
        }
      } catch (error) {
        logger.error("Failed to check payment status", { error });
      }
    };

    // Check immediately on mount
    void checkPaymentStatus();

    // Then poll every 10s
    const interval = setInterval(checkPaymentStatus, 10000);

    return () => clearInterval(interval);
  }, [addresses, paymentStatus, orgSlug, router, plan]);

  // Handle expiration
  const handleExpiration = () => {
    setPaymentStatus("expired");
    toast.error("Payment session expired. Please try again.");
  };

  // Copy address to clipboard
  const copyToClipboard = async (address: string, network: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${network} address copied to clipboard!`);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  // Loading state
  if (generateMutation.isPending || !addresses || !expiresAt) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Generating Payment Addresses...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            Complete Your Payment - {planData.name} Plan
          </h1>
          <TestnetBadge isTestnet={isTestnet} />
        </div>
        <p className="text-muted-foreground">
          Send ${planData.priceUSD} in USDC (Base) or USDT (Tron) to one of the
          addresses below
        </p>
      </div>

      {/* Payment Status Alert */}
      {paymentStatus === "confirmed" && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="size-5 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment confirmed! Activating your subscription...
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "expired" && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <Timer className="size-5 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment session expired. Please refresh to generate new addresses.
          </AlertDescription>
        </Alert>
      )}

      {/* Timer Card */}
      {paymentStatus === "pending" && (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="size-5" />
              <span className="font-medium">Time Remaining:</span>
            </div>
            <Countdown
              date={expiresAt}
              onComplete={handleExpiration}
              renderer={({ minutes, seconds }) => (
                <Badge variant="secondary" className="font-mono text-lg">
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </Badge>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Payment Instructions */}
      <div className="mb-6 flex flex-col gap-8 lg:flex-row">
        {/* Base Network */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-blue-500" />
                {isTestnet
                  ? SiteConfig.crypto.testnet.base.name
                  : SiteConfig.crypto.networks.base.name}{" "}
                (USDC)
              </CardTitle>
              <Badge variant="secondary">Recommended</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* QR Code */}
              {qrCodes?.base && (
                <div className="flex justify-center">
                  <img
                    src={qrCodes.base}
                    alt="Base USDC Address QR Code"
                    className="rounded-lg border"
                  />
                </div>
              )}

              {/* Address */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Send USDC to:</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border-2 px-3 py-2 font-mono text-xs break-all">
                    {addresses.base.address}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () =>
                      copyToClipboard(addresses.base.address, "Base")
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-muted/50 rounded-lg border p-4">
                <p className="text-sm font-medium">
                  <span className="font-semibold">Amount:</span> $
                  {planData.priceUSD} USDC
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Lower fees • Faster confirmation (1 block)
                </p>
              </div>

              {/* Explorer Link */}
              <Button variant="link" size="sm" asChild className="self-start">
                <a
                  href={`${isTestnet ? SiteConfig.crypto.testnet.base.explorerUrl : SiteConfig.crypto.networks.base.explorerUrl}/address/${addresses.base.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on {isTestnet ? "Sepolia BaseScan" : "BaseScan"}{" "}
                  <ExternalLink className="ml-1 size-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tron Network */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-red-500" />
                {isTestnet
                  ? SiteConfig.crypto.testnet.tron.name
                  : SiteConfig.crypto.networks.tron.name}{" "}
                (USDT)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* QR Code */}
              {qrCodes?.tron && (
                <div className="flex justify-center">
                  <img
                    src={qrCodes.tron}
                    alt="Tron USDT Address QR Code"
                    className="rounded-lg border"
                  />
                </div>
              )}

              {/* Address */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Send USDT (TRC-20) to:
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border-2 px-3 py-2 font-mono text-xs break-all">
                    {addresses.tron.address}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () =>
                      copyToClipboard(addresses.tron.address, "Tron")
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-muted/50 rounded-lg border p-4">
                <p className="text-sm font-medium">
                  <span className="font-semibold">Amount:</span> $
                  {planData.priceUSD} USDT
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  TRC-20 only • Requires 2 confirmations
                </p>
              </div>

              {/* Explorer Link */}
              <Button variant="link" size="sm" asChild className="self-start">
                <a
                  href={`${isTestnet ? SiteConfig.crypto.testnet.tron.explorerUrl : SiteConfig.crypto.networks.tron.explorerUrl}/#/address/${addresses.tron.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on {isTestnet ? "Shasta TronScan" : "TronScan"}{" "}
                  <ExternalLink className="ml-1 size-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicator */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            {paymentStatus === "pending" && (
              <>
                <Loader2 className="size-5 animate-spin text-blue-600" />
                <span className="text-muted-foreground text-sm font-medium">
                  Waiting for payment confirmation...
                </span>
              </>
            )}
            {paymentStatus === "confirmed" && (
              <>
                <CheckCircle2 className="size-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Payment confirmed! Redirecting...
                </span>
              </>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-muted-foreground text-center text-xs">
              Your payment will be detected automatically.
            </p>
            <p className="text-center text-xs font-semibold text-amber-600">
              ⚠️ Do not leave this page until payment is detected.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Button */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="ghost"
          onClick={() => router.push(`/orgs/${orgSlug}/pricing`)}
          disabled={paymentStatus === "confirmed"}
        >
          Cancel and Return to Pricing
        </Button>
      </div>

      {/* Test Payment Success Dialog */}
      <TestPaymentSuccessDialog
        open={showTestSuccessDialog}
        onOpenChange={setShowTestSuccessDialog}
        orgSlug={orgSlug}
      />
    </div>
  );
};
