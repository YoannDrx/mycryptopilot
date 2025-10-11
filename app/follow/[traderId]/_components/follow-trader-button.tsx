"use client";

import { FollowButton } from "@/components/nowts/follow-button";
import { useRouter } from "next/navigation";

type FollowTraderButtonProps = {
  traderId: string;
  traderName: string;
  orgSlug: string;
};

export const FollowTraderButton = ({
  traderId,
  traderName,
  orgSlug,
}: FollowTraderButtonProps) => {
  const router = useRouter();

  const handleFollowSuccess = () => {
    // Redirect to dashboard after successful follow
    router.push(`/orgs/${orgSlug}/dashboard`);
    router.refresh();
  };

  return (
    <FollowButton
      traderId={traderId}
      traderName={traderName}
      isFollowing={false}
      variant="default"
      size="lg"
      onFollowSuccess={handleFollowSuccess}
    />
  );
};
