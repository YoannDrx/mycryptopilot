"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { auth } from "../auth";
import type { AuthOrganization, AuthFullOrganization } from "./auth-type";

/**
 * Safe Auth API Helper
 *
 * Wraps Better Auth API calls with proper typing to work around
 * InferAPI type inference issues in Better Auth 1.3.8
 *
 * All `as any` casts are centralized here to make future upgrades easier.
 * When Better Auth fixes type inference, only this file needs to change.
 *
 * @see https://www.better-auth.com/docs/plugins/organization
 */

/**
 * List all organizations where the user is a member
 */
export async function listOrganizationsApi(): Promise<AuthOrganization[]> {
  const result = await (auth.api as any).listOrganizations({
    headers: headers(),
  });
  return result as AuthOrganization[];
}

/**
 * Set the active organization for the current session
 */
export async function setActiveOrganizationApi(
  organizationId: string,
): Promise<void> {
  await (auth.api as any).setActiveOrganization({
    body: { organizationId },
    headers: headers(),
  });
}

/**
 * Check if user has a specific permission
 */
export async function hasPermissionApi(
  permission: string | Record<string, unknown>,
): Promise<{ success: boolean }> {
  const result = await (auth.api as any).hasPermission({
    headers: headers(),
    body: { permission },
  });
  return result;
}

/**
 * Create a new organization
 */
export async function createOrganizationApi(data: {
  name: string;
  slug?: string;
}): Promise<AuthOrganization> {
  const result = await (auth.api as any).createOrganization({
    body: data,
    headers: headers(),
  });
  return result as AuthOrganization;
}

/**
 * Get full organization with members by slug
 */
export async function getFullOrganizationApi(
  organizationSlug: string,
): Promise<AuthFullOrganization | null> {
  const result = await (auth.api as any).getFullOrganization({
    query: { organizationSlug },
    headers: headers(),
  });
  return result as AuthFullOrganization | null;
}

/**
 * Accept an organization invitation
 */
export async function acceptInvitationApi(
  invitationId: string,
): Promise<{ success: boolean }> {
  const result = await (auth.api as any).acceptInvitation({
    body: { invitationId },
    headers: headers(),
  });
  return result;
}

/**
 * Get current session
 */
export async function getSessionApi(requestHeaders?: Headers) {
  const result = await (auth.api as any).getSession({
    headers: requestHeaders ?? headers(),
  });
  return result;
}

/**
 * Get full organization (with query parameter)
 */
export async function getFullOrganizationApiWithHeaders(
  requestHeaders?: Headers,
): Promise<AuthFullOrganization | null> {
  const result = await (auth.api as any).getFullOrganization({
    headers: requestHeaders ?? headers(),
  });
  return result as AuthFullOrganization | null;
}
