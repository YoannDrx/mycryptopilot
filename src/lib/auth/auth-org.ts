import { hasPermissionApi } from "./auth-api-helper";
import type { AuthPermission } from "./auth-permissions";

export const hasPermission = async (permission: AuthPermission) => {
  const result = await hasPermissionApi(permission);
  return result.success;
};
