"use client";

import { FollowButton } from "@/components/nowts/follow-button";
import { useRouter } from "next/navigation";

type FollowTraderButtonProps = {
  traderId: string;
  traderName: string;
  userId?: string;
};

export const FollowTraderButton = ({
  traderId,
  traderName,
  userId,
}: FollowTraderButtonProps) => {
  const router = useRouter();

  const handleFollowSuccess = () => {
    // Redirect to dashboard after successful follow
    router.push("/traders");
    router.refresh();
  };

  return (
    <FollowButton
      traderId={traderId}
      traderName={traderName}
      isFollowing={false}
      userId={userId}
      variant="default"
      size="lg"
      source="REFERRAL"
      onFollowSuccess={handleFollowSuccess}
      className="w-full"
    />
  );
};
