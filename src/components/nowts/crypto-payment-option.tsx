"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import type { CryptoNetwork } from "@/generated/prisma";
import { useRouter } from "next/navigation";

type CryptoPaymentOptionProps = {
  network: CryptoNetwork;
  currency: string;
  plan: "pro" | "ultra";
  amount: number;
  networkName: string;
  networkDescription: string;
  confirmationTime: string;
  requiredConfirmations: number;
};

type PaymentAddress = {
  addressId: string;
  address: string;
  qrData: string;
};

type PaymentStatus = {
  status: "PENDING" | "CONFIRMED" | "EXPIRED" | "NOT_FOUND" | "ERROR" | string;
  payment?: {
    txHash: string | null;
    confirmations: number;
    amountUSD: number;
  };
  message?: string;
  error?: string;
};

export function CryptoPaymentOption({
  network,
  currency,
  plan,
  amount,
  networkName,
  networkDescription,
  confirmationTime,
  requiredConfirmations,
}: CryptoPaymentOptionProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState<PaymentAddress | null>(
    null,
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes en secondes
  const [isExpired, setIsExpired] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!paymentAddress || isExpired) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentAddress, isExpired]);

  // Polling payment status
  useEffect(() => {
    if (!paymentAddress || isExpired) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/crypto/payment-status/${paymentAddress.addressId}`,
        );
        const data = (await response.json()) as PaymentStatus;

        setPaymentStatus(data);

        // Rediriger si paiement confirmé
        if (data.status === "CONFIRMED") {
          toast.success("Payment confirmed! Activating your subscription...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch {
        // Silent fail pour le polling
      }
    };

    // Poll immediately
    void pollStatus();

    // Then poll every 5 seconds
    const interval = setInterval(() => {
      void pollStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentAddress, isExpired, router]);

  // Générer l'adresse de paiement
  const handleGenerateAddress = async () => {
    setIsGenerating(true);
    setIsExpired(false);
    setTimeRemaining(15 * 60);

    try {
      const response = await fetch("/api/crypto/generate-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network,
          plan,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate address");
      }

      const data = (await response.json()) as PaymentAddress;
      setPaymentAddress(data);
      toast.success("Payment address generated!");
    } catch {
      toast.error("Failed to generate payment address. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copier l'adresse
  const handleCopyAddress = async () => {
    if (!paymentAddress) return;

    try {
      await navigator.clipboard.writeText(paymentAddress.address);
      toast.success("Address copied to clipboard!");
    } catch {
      toast.error("Failed to copy address");
    }
  };

  // Format timer (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Si pas encore d'adresse générée
  if (!paymentAddress) {
    return (
      <div className="space-y-4 p-6">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">
            {networkName} ({currency})
          </h3>
          <p className="text-muted-foreground text-sm">{networkDescription}</p>
          <p className="text-sm">
            <span className="font-medium">Confirmation time:</span>{" "}
            {confirmationTime}
          </p>
        </div>

        <Button
          onClick={handleGenerateAddress}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating address...
            </>
          ) : (
            <>
              Pay ${amount} with {currency}
            </>
          )}
        </Button>
      </div>
    );
  }

  // Si expiré
  if (isExpired) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment session expired. Please generate a new address.
          </AlertDescription>
        </Alert>

        <Button onClick={handleGenerateAddress} className="w-full" size="lg">
          Generate New Address
        </Button>
      </div>
    );
  }

  // Si paiement confirmé
  if (paymentStatus?.status === "CONFIRMED") {
    return (
      <div className="space-y-4 p-6">
        <Alert className="border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            Payment confirmed! Redirecting to dashboard...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Affichage normal avec QR code
  return (
    <div className="space-y-6 p-6">
      {/* Instructions */}
      <div className="space-y-2">
        <h3 className="text-center text-lg font-semibold">
          Payment Instructions
        </h3>
        <ol className="text-muted-foreground space-y-1 text-sm">
          <li>
            <span className="font-medium">1.</span> Scan QR code or copy address
          </li>
          <li>
            <span className="font-medium">2.</span> Send exactly{" "}
            <span className="text-foreground font-bold">
              ${amount} {currency}
            </span>{" "}
            on {networkName} network
          </li>
          <li>
            <span className="font-medium">3.</span> Wait for{" "}
            {requiredConfirmations} confirmation(s) ({confirmationTime})
          </li>
        </ol>
      </div>

      {/* QR Code */}
      <div className="flex justify-center rounded-lg bg-white p-6">
        <QRCode value={paymentAddress.qrData} size={200} />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Address</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={paymentAddress.address}
            readOnly
            className="bg-muted flex-1 rounded-md border px-3 py-2 font-mono text-sm"
          />
          <Button onClick={handleCopyAddress} variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount</label>
        <div className="bg-muted rounded-md border px-3 py-2 text-sm font-bold">
          {amount} {currency}
        </div>
      </div>

      {/* Network */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Network</label>
        <div className="bg-muted rounded-md border px-3 py-2 text-sm">
          {networkName}
        </div>
      </div>

      {/* Timer */}
      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
        <span className="text-sm font-medium">Time remaining</span>
        <span className="font-mono text-lg font-bold">
          {formatTime(timeRemaining)}
        </span>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Status</label>
        {!paymentStatus ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            {paymentStatus.status === "PENDING" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm">
                  {paymentStatus.message ?? "Waiting for payment..."}
                </span>
              </>
            )}
            {paymentStatus.status === "CONFIRMED" && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">
                  Payment confirmed! ({paymentStatus.payment?.confirmations}{" "}
                  confirmations)
                </span>
              </>
            )}
            {paymentStatus.status === "ERROR" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">
                  {paymentStatus.error ?? "Error checking payment"}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Warning */}
      <Alert>
        <AlertDescription className="text-xs">
          ⚠️ Only send {currency} on {networkName} network. Sending other tokens
          or using wrong network will result in loss of funds.
        </AlertDescription>
      </Alert>
    </div>
  );
}
