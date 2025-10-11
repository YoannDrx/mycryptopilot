"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CryptoPaymentOption } from "./crypto-payment-option";
import type { CryptoNetwork } from "@/generated/prisma";

type Plan = {
  name: string;
  displayName: string;
  price: number;
  features: string[];
};

type CheckoutPageProps = {
  plan: "pro" | "ultra";
  planDetails: Plan;
};

export function CheckoutPage({ plan, planDetails }: CheckoutPageProps) {
  const [_selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork | null>(
    null,
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">
          Subscribe to {planDetails.displayName} Plan
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-bold">${planDetails.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <Badge variant="secondary" className="mt-2">
          Pay with Crypto (USDC or USDT)
        </Badge>
      </div>

      {/* Plan Features Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What's included</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {planDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose your preferred network and currency
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="base"
            onValueChange={(value) =>
              setSelectedNetwork(value.toUpperCase() as CryptoNetwork)
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="base">
                Base USDC
                <Badge variant="outline" className="ml-2">
                  ~2s
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="tron">
                Tron USDT
                <Badge variant="outline" className="ml-2">
                  ~3s
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="base">
              <CryptoPaymentOption
                network="BASE"
                currency="USDC"
                plan={plan}
                amount={planDetails.price}
                networkName="Base"
                networkDescription="Ethereum Layer 2 - Fast & cheap transactions"
                confirmationTime="~2 seconds"
                requiredConfirmations={1}
              />
            </TabsContent>

            <TabsContent value="tron">
              <CryptoPaymentOption
                network="TRON"
                currency="USDT"
                plan={plan}
                amount={planDetails.price}
                networkName="Tron"
                networkDescription="TRC-20 network - Widely supported"
                confirmationTime="~3 seconds"
                requiredConfirmations={2}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Footer */}
      <div className="text-muted-foreground mt-6 text-center text-sm">
        <p>Need help? Join our Discord or contact support</p>
      </div>
    </div>
  );
}
