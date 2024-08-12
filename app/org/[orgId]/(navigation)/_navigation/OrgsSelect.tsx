"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

type OrganizationsSelectProps = {
  currentOrgId?: string;
  children?: ReactNode;
  orgs: {
    id: string;
    name: string;
    image: string | null;
  }[];
};

export const OrgsSelect = (props: OrganizationsSelectProps) => {
  const router = useRouter();
  return (
    <Select
      value={props.currentOrgId}
      onValueChange={(value) => {
        if (value === "new") {
          router.push("/org/new");
          return;
        }

        const currentUrl = window.location.href;
        const newUrl = props.currentOrgId
          ? currentUrl.replace(`/org/${props.currentOrgId}`, `/org/${value}`)
          : `/org/${value}`;

        router.push(newUrl);
      }}
    >
      <SelectTrigger className="h-8 justify-start gap-2 border-none bg-transparent px-4 hover:bg-accent [&>span]:flex [&>svg]:hidden hover:[&>svg]:block">
        {props.children ? props.children : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {props.orgs.map((org) => (
          <SelectItem key={org.id} value={org.id} className="h-fit">
            <span className="inline-flex h-full items-center gap-1">
              <Avatar className="size-6">
                <AvatarFallback>
                  {org.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
                {org.image ? <AvatarImage src={org.image} /> : null}
              </Avatar>
              <span className="line-clamp-1">{org.name}</span>
            </span>
          </SelectItem>
        ))}
        <SelectItem value="new">Add a new organization</SelectItem>
      </SelectContent>
    </Select>
  );
};
