"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type TestPaymentSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
};

/**
 * TestPaymentSuccessDialog Component
 *
 * Displays a success modal when a test payment ($1) is confirmed.
 * Congratulates the user and guides them to upgrade to a full plan.
 *
 * Triggers:
 * - After test payment is confirmed on-chain
 * - User receives confirmation email simultaneously
 */
export function TestPaymentSuccessDialog({
  open,
  onOpenChange,
  orgSlug,
}: TestPaymentSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="size-12 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Test Payment Successful! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Your $1 test payment has been confirmed on-chain. The crypto payment
            system works perfectly!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/30 rounded-lg border p-4">
            <h4 className="mb-2 font-semibold">What happens next?</h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>
                  You've verified that crypto payments work on our platform
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>A confirmation email has been sent to your inbox</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>
                  You can now confidently subscribe to Pro or Ultra plan
                </span>
              </li>
            </ul>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            The test payment is visible in your payment history.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" className="w-full">
            <Link href={`/orgs/${orgSlug}/pricing`}>
              View Plans & Subscribe
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
