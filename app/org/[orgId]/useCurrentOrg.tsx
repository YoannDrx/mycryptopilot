import { OrganizationPlan } from "@prisma/client";
import { PropsWithChildren } from "react";
import { create } from "zustand";

type CurrentOrgStore = {
  id: string;
  name: string;
  image: string | null;
  plan: OrganizationPlan;
};

export const useCurrentOrg = create<CurrentOrgStore | null>(() => null);

export const InjectCurrentOrgStore = (
  props: PropsWithChildren<{
    org?: CurrentOrgStore;
  }>,
) => {
  if (!props.org) return props.children;

  useCurrentOrg.setState({
    id: props.org.id,
    name: props.org.name,
    image: props.org.image,
    plan: props.org.plan,
  });
  return props.children;
};
