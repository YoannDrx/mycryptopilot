"use client";

import { FollowButton } from "@/components/nowts/follow-button";
import { useRouter } from "next/navigation";

type FollowTraderButtonProps = {
  traderId: string;
  traderName: string;
};

export const FollowTraderButton = ({
  traderId,
  traderName,
}: FollowTraderButtonProps) => {
  const router = useRouter();

  const handleFollowSuccess = () => {
    // Redirect to dashboard after successful follow
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <FollowButton
      traderId={traderId}
      traderName={traderName}
      isFollowing={false}
      variant="default"
      size="lg"
      source="REFERRAL"
      onFollowSuccess={handleFollowSuccess}
      className="w-full"
    />
  );
};
