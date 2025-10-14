/**
 * Navigation Layout
 *
 * Layout parent minimal pour les 4 espaces (Trading, School, Tax, Account).
 * Chaque espace a son propre layout avec sidebar dédiée.
 * L'injection de l'org store est gérée au niveau supérieur (layout.tsx parent).
 */
export default async function NavigationLayout(
  props: LayoutProps<"/orgs/[orgSlug]">,
) {
  return <>{props.children}</>;
}
