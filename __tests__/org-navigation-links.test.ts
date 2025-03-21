import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_LINKS,
  getOrganizationNavigation,
} from "../app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.links";
import type { AuthRole } from "../src/lib/auth/auth-permissions";

describe("getOrganizationNavigation", () => {
  it("should replace organization slug in all URLs", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["member"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Check that all links have the slug replaced
    result.forEach((group) => {
      if (group.defaultOpenStartPath) {
        expect(group.defaultOpenStartPath).not.toContain(":organizationSlug");
        expect(group.defaultOpenStartPath).toContain(slug);
      }

      group.links.forEach((link) => {
        expect(link.href).not.toContain(":organizationSlug");
        expect(link.href).toContain(slug);
      });
    });
  });

  it("should filter links based on user roles - member", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["member"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Check that member can access general links
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);

    // Check that member cannot access admin/owner restricted links
    const settingsGroup = result[1];
    const allowedLinks = settingsGroup.links;

    // Should only see Settings page, not Members, Billing or Danger Zone
    expect(allowedLinks.length).toBeLessThan(
      ORGANIZATION_LINKS[1].links.length,
    );

    // Should only see Settings
    expect(allowedLinks.map((link) => link.label)).toContain("Settings");

    // Should not see Members, Billing, Danger Zone (admin/owner only)
    expect(allowedLinks.map((link) => link.label)).not.toContain("Members");
    expect(allowedLinks.map((link) => link.label)).not.toContain("Billing");
    expect(allowedLinks.map((link) => link.label)).not.toContain("Danger Zone");
  });

  it("should filter links based on user roles - admin", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["admin"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Check that admin can access general links
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);

    // Check that admin can access admin links but not owner links
    const settingsGroup = result[1];
    const allowedLinks = settingsGroup.links;

    // Should see Settings, Members, and Billing, but not Danger Zone
    expect(allowedLinks.map((link) => link.label)).toContain("Settings");
    expect(allowedLinks.map((link) => link.label)).toContain("Members");
    expect(allowedLinks.map((link) => link.label)).toContain("Billing");
    expect(allowedLinks.map((link) => link.label)).not.toContain("Danger Zone");
  });

  it("should filter links based on user roles - owner", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["owner"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Check that owner can access all links
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);

    // Check that owner can access all links
    const settingsGroup = result[1];
    const allowedLinks = settingsGroup.links;

    // Should see all settings links
    expect(allowedLinks.length).toEqual(ORGANIZATION_LINKS[1].links.length);
    expect(allowedLinks.map((link) => link.label)).toContain("Settings");
    expect(allowedLinks.map((link) => link.label)).toContain("Members");
    expect(allowedLinks.map((link) => link.label)).toContain("Billing");
    expect(allowedLinks.map((link) => link.label)).toContain("Danger Zone");
  });

  it("should handle undefined user roles", () => {
    const slug = "test-org";
    const userRoles = undefined;

    const result = getOrganizationNavigation(slug, userRoles);

    // Should only return links with no role restrictions
    result.forEach((group) => {
      group.links.forEach((link) => {
        // Only links without roles should be included
        expect(link.roles).toBeUndefined();
      });
    });

    // First group has no role restrictions
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);

    // Second group has links with role restrictions
    expect(result[1].links).toHaveLength(1); // Only Settings link has no role restriction
    expect(result[1].links[0].label).toBe("Settings");
  });
});
