"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FollowButtonProps = {
  traderId: string;
};

export const FollowButton = ({ traderId: _traderId }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleFollowToggle = async () => {
    setIsPending(true);

    try {
      // TODO: Implement follow/unfollow action (issue #17)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsFollowing(!isFollowing);
      toast.success(
        isFollowing ? "Vous ne suivez plus ce trader" : "Vous suivez ce trader",
      );
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isPending}
      variant={isFollowing ? "outline" : "default"}
      className="gap-2"
    >
      <Heart className={isFollowing ? "fill-current" : ""} size={16} />
      {isFollowing ? "Ne plus suivre" : "Suivre"}
    </Button>
  );
};
