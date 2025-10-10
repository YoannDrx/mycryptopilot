import { CheckoutPage } from "@/components/nowts/checkout-page";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    orgSlug: string;
    plan: string;
  }>;
};

export default async function CryptoCheckoutPage(props: PageProps) {
  const params = await props.params;
  const { plan } = params;

  // Vérifier que l'utilisateur est authentifié
  await getRequiredUser();

  // Valider le plan
  const validPlans = ["pro", "ultra"];
  if (!validPlans.includes(plan)) {
    redirect("/pricing");
  }

  // Récupérer les détails du plan
  const planDetails = MYCRYPTOPILOT_PLANS.find((p) => p.name === plan);

  if (!planDetails) {
    redirect("/pricing");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CheckoutPage
        plan={plan as "pro" | "ultra"}
        planDetails={{
          name: planDetails.name,
          displayName: planDetails.name.charAt(0).toUpperCase() + planDetails.name.slice(1),
          price: planDetails.priceUSD,
          features: planDetails.features.map((f) => f.label),
        }}
      />
    </div>
  );
}
