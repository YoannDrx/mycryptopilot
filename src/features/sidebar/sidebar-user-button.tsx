"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { UserDropdown } from "../auth/user-dropdown";

export const SidebarUserButton = () => {
  const session = useSession();
  const data = session.data?.user;
  return (
    <UserDropdown>
      <Button variant="outline">
        <Avatar className="size-6">
          <AvatarFallback>{data?.name[0] ?? "-"}</AvatarFallback>
          {data?.image && <AvatarImage src={data.image} />}
        </Avatar>
        <span>{data?.name}</span>
      </Button>
    </UserDropdown>
  );
};
