import {
  adminClient,
  emailOTPClient,
  lastLoginMethodClient,
  magicLinkClient,
  multiSessionClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: getServerUrl(),
  plugins: [
    magicLinkClient(),
    adminClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
    multiSessionClient(),
  ],
});

export type AuthClientType = typeof authClient;

export const { useSession, signOut } = authClient;
