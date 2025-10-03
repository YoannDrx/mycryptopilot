/**
 * MyCryptoPilot: Members page disabled
 *
 * In MyCryptoPilot, users have personal accounts only (no team members).
 * This page redirects to the main settings page.
 */

import { redirect } from "next/navigation";

export default async function RoutePage(
  props: PageProps<"/orgs/[orgSlug]/settings/members">,
) {
  const params = await props.params;
  // MyCryptoPilot: Redirect to settings (no team members in personal accounts)
  redirect(`/orgs/${params.orgSlug}/settings`);
}
