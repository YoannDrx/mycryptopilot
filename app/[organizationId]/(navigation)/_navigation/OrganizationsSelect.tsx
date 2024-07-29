"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export type OrganizationsSelectProps = {
  currentOrganizationId: string;
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
        if (value === "new") {
          router.push("/organizations/new");
          return;
        }

        const currentUrl = window.location.href;
        const newUrl = currentUrl.replace(
          `/${props.currentOrganizationId}`,
          `/${value}`,
        );
        router.push(newUrl);
      }}
    >
      <SelectTrigger className="border-none bg-transparent hover:bg-accent [&>svg]:hidden hover:[&>svg]:block">
        <SelectValue />
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
