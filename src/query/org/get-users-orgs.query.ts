import { listOrganizationsApi } from "@/lib/auth/auth-api-helper";

export async function getUsersOrgs() {
  const userOrganizations = await listOrganizationsApi();
  return userOrganizations;
}
