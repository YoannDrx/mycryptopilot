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

export type OrganizationsSelectProps = {
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
      <SelectTrigger className="justify-start gap-2 border-none bg-transparent hover:bg-accent [&>svg]:hidden hover:[&>svg]:block">
        {props.children ? props.children : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {props.orgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <span className="inline-flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback>
                  {org.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
                {org.image ? <AvatarImage src={org.image} /> : null}
              </Avatar>
              {org.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="new">Add a new organization</SelectItem>
      </SelectContent>
    </Select>
  );
};
