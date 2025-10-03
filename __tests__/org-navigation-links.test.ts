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

    // Menu and Trader groups are present (no Account group for members)
    expect(result).toHaveLength(2);
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);
    expect(result[1].links).toHaveLength(ORGANIZATION_LINKS[1].links.length);
  });

  it("should filter links based on user roles - admin", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["admin"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Admin can access Menu, Trader, and Account groups
    expect(result).toHaveLength(3);
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);

    // Admin can access Settings, Members, Billing (not Danger Zone)
    const accountGroup = result[2];
    const allowedLinks = accountGroup.links;
    expect(allowedLinks.map((link) => link.label)).toContain("Settings");
    expect(allowedLinks.map((link) => link.label)).toContain("Members");
    expect(allowedLinks.map((link) => link.label)).toContain("Billing");
    expect(allowedLinks.map((link) => link.label)).not.toContain("Danger Zone");
  });

  it("should filter links based on user roles - owner", () => {
    const slug = "test-org";
    const userRoles: AuthRole[] = ["owner"];

    const result = getOrganizationNavigation(slug, userRoles);

    // Owner can access all links (Menu, Trader, and Account with all sub-links)
    expect(result).toHaveLength(3);
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);
    const accountGroup = result[2];
    const allowedLinks = accountGroup.links;
    expect(allowedLinks.length).toEqual(ORGANIZATION_LINKS[2].links.length);
    expect(allowedLinks.map((link) => link.label)).toContain("Settings");
    expect(allowedLinks.map((link) => link.label)).toContain("Members");
    expect(allowedLinks.map((link) => link.label)).toContain("Billing");
    expect(allowedLinks.map((link) => link.label)).toContain("Danger Zone");
  });

  it("should handle undefined user roles", () => {
    const slug = "test-org";
    const userRoles = undefined;

    const result = getOrganizationNavigation(slug, userRoles);

    // Menu and Trader groups are present (no Account group without roles)
    expect(result).toHaveLength(2);
    expect(result[0].links).toHaveLength(ORGANIZATION_LINKS[0].links.length);
    expect(result[1].links).toHaveLength(ORGANIZATION_LINKS[1].links.length);
  });
});
