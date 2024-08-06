import { Typography } from "@/components/ui/typography";
import { auth } from "@/lib/auth/helper";
import type { LayoutParams } from "@/types/next";
import { CircleAlert } from "lucide-react";
import { Metadata } from "next";
import { AccountNavigation } from "./AccountNavigation";
import { VerifyEmailButton } from "./account/verify-email/VerifyEmailButton";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your account settings.",
};

export default async function RouteLayout(props: LayoutParams<{}>) {
  const user = await auth();
  return (
    <div>
      {!user?.emailVerified ? (
        <div className="flex items-center gap-4 bg-primary px-4 py-1">
          <CircleAlert size={16} />
          <Typography variant="small">
            Email not verified. Please verify your email.
          </Typography>
          <VerifyEmailButton
            variant="invert"
            className="ml-auto flex h-6 w-fit items-center gap-1 rounded-md px-3 text-sm"
          />
        </div>
      ) : null}
      <AccountNavigation>{props.children}</AccountNavigation>
    </div>
  );
}
