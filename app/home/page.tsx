import HomePage from "../page";

// Force dynamic rendering (inherited from parent page)
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <HomePage />;
}
