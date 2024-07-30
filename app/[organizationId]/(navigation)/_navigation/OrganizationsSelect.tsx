"use client";

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
  currentOrganizationId?: string;
  children?: ReactNode;
  organizations: {
    id: string;
    name: string;
  }[];
};

export const OrganizationsSelect = (props: OrganizationsSelectProps) => {
  const router = useRouter();
  return (
    <Select
      value={props.currentOrganizationId}
      onValueChange={(value) => {
        console.log("Value change", value);
        if (value === "new") {
          router.push("/organizations/new");
          return;
        }

        const currentUrl = window.location.href;
        const newUrl = props.currentOrganizationId
          ? currentUrl.replace(`/${props.currentOrganizationId}`, `/${value}`)
          : `/${value}`;
        console.log({ newUrl });
        router.push(newUrl);
      }}
    >
      <SelectTrigger className="justify-start gap-2 border-none bg-transparent hover:bg-accent [&>svg]:hidden hover:[&>svg]:block">
        {props.children ? props.children : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {props.organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
        <SelectItem value="new">Add a new organization</SelectItem>
      </SelectContent>
    </Select>
  );
};
