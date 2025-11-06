import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import {
  User,
  MessageCircle,
  Mail,
  Users,
  Shield,
  Settings,
  TrendingUp,
  CreditCard,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Account Settings - MyCryptoPilot",
  description: "Manage your account settings, profile, and preferences",
};

export default async function AccountPage() {
  const accountSections = [
    {
      title: "Profile Settings",
      description: "Update your personal information and profile picture",
      icon: User,
      href: "/account/(settings)",
    },
    {
      title: "Discord Connection",
      description: "Link your Discord account to receive real-time signals",
      icon: MessageCircle,
      href: "/account/discord",
    },
    {
      title: "Email Preferences",
      description: "Manage your email notifications and preferences",
      icon: Mail,
      href: "/account/email",
    },
    {
      title: "Following",
      description: "Manage the traders you follow",
      icon: Users,
      href: "/account/following",
    },
    {
      title: "Become a Trader",
      description: "Start sharing your trading signals with the community",
      icon: TrendingUp,
      href: "/account/become-trader",
    },
    {
      title: "Exchange Connections",
      description:
        "Connect your Binance or Bybit accounts for portfolio tracking",
      icon: CreditCard,
      href: "/account/exchanges",
    },
    {
      title: "Payment History",
      description: "View your crypto payment history and subscriptions",
      icon: CreditCard,
      href: "/account/payments",
    },
    {
      title: "Password & Security",
      description: "Change your password and manage account security",
      icon: Shield,
      href: "/account/change-password",
    },
    {
      title: "Danger Zone",
      description: "Delete your account or perform critical actions",
      icon: Settings,
      href: "/account/danger",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Account Sections Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.href}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-lg p-2">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{section.description}</CardDescription>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={section.href}>Manage</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
