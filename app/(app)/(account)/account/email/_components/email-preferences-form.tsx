"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { updateEmailPreferencesAction } from "../update-preferences.action";

type EmailPreferences = {
  emailNotificationsEnabled: boolean;
  emailNotifyNewSignals: boolean;
  emailNotifySubscriptionReminders: boolean;
  emailNotifyExchangeSyncFailures: boolean;
  emailNotifyTraderInvitations: boolean;
  emailNotifyWeeklyPerformance: boolean;
  emailNotifyMarketingUpdates: boolean;
};

type EmailPreferencesFormProps = {
  initialPreferences: EmailPreferences;
};

export function EmailPreferencesForm({
  initialPreferences,
}: EmailPreferencesFormProps) {
  const [preferences, setPreferences] =
    useState<EmailPreferences>(initialPreferences);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EmailPreferences>) => {
      const result = await updateEmailPreferencesAction(updates);
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Email preferences updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const handleToggle = (key: keyof EmailPreferences, value: boolean) => {
    // Update local state
    setPreferences((prev) => ({ ...prev, [key]: value }));

    // Update server
    updateMutation.mutate({ [key]: value });

    // If master toggle is being disabled, disable all sub-toggles
    if (key === "emailNotificationsEnabled" && !value) {
      setPreferences((prev) => ({
        ...prev,
        emailNotificationsEnabled: false,
        emailNotifyNewSignals: false,
        emailNotifySubscriptionReminders: false,
        emailNotifyExchangeSyncFailures: false,
        emailNotifyTraderInvitations: false,
        emailNotifyWeeklyPerformance: false,
        emailNotifyMarketingUpdates: false,
      }));

      // Also update all on server
      updateMutation.mutate({
        emailNotificationsEnabled: false,
        emailNotifyNewSignals: false,
        emailNotifySubscriptionReminders: false,
        emailNotifyExchangeSyncFailures: false,
        emailNotifyTraderInvitations: false,
        emailNotifyWeeklyPerformance: false,
        emailNotifyMarketingUpdates: false,
      });
    }
  };

  const masterEnabled = preferences.emailNotificationsEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Manage which emails you want to receive. Critical security and payment
          emails cannot be disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="border-b pb-4">
          <PreferenceToggle
            id="master"
            label="Enable Email Notifications"
            description="Master switch for all non-critical emails"
            checked={preferences.emailNotificationsEnabled}
            onCheckedChange={(checked) =>
              handleToggle("emailNotificationsEnabled", checked)
            }
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Notification Emails */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold">Notification Emails</h4>

          <PreferenceToggle
            id="signals"
            label="New Trading Signals"
            description="Receive emails when traders you follow publish new signals"
            checked={preferences.emailNotifyNewSignals}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifyNewSignals", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />

          <PreferenceToggle
            id="subscription"
            label="Subscription Reminders"
            description="Reminders when your subscription is about to expire"
            checked={preferences.emailNotifySubscriptionReminders}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifySubscriptionReminders", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />

          <PreferenceToggle
            id="exchange"
            label="Exchange Sync Failures"
            description="Alerts when automatic exchange sync fails"
            checked={preferences.emailNotifyExchangeSyncFailures}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifyExchangeSyncFailures", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />

          <PreferenceToggle
            id="invitations"
            label="Trader Invitations"
            description="Receive invitations from traders to follow them"
            checked={preferences.emailNotifyTraderInvitations}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifyTraderInvitations", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />

          <PreferenceToggle
            id="performance"
            label="Weekly Performance Summary"
            description="Weekly digest of your trading performance (traders only)"
            checked={preferences.emailNotifyWeeklyPerformance}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifyWeeklyPerformance", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />
        </div>

        {/* Marketing Emails */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-base font-semibold">Marketing & Updates</h4>

          <PreferenceToggle
            id="marketing"
            label="Newsletter & Product Updates"
            description="News, feature announcements, and tips"
            checked={preferences.emailNotifyMarketingUpdates}
            onCheckedChange={(checked) =>
              handleToggle("emailNotifyMarketingUpdates", checked)
            }
            disabled={!masterEnabled || updateMutation.isPending}
          />
        </div>

        {/* Critical Emails Info */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground text-sm">
            ℹ️ Security emails (password reset, email verification) and payment
            confirmations cannot be disabled.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type PreferenceToggleProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-1"
      />
      <div className="flex-1">
        <Label
          htmlFor={id}
          className={`cursor-pointer font-medium ${disabled ? "opacity-50" : ""}`}
        >
          {label}
        </Label>
        <p
          className={`text-muted-foreground mt-1 text-sm ${disabled ? "opacity-50" : ""}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
