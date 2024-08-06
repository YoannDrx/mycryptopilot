import Link from "next/link";
import { buttonVariants } from "../../components/ui/button";
import { Typography } from "../../components/ui/typography";
import { SignInButton } from "../auth/SignInButton";

export function Page401() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-8">
      <div className="max-w-lg space-y-3 text-center">
        <Typography variant="code">401</Typography>
        <Typography variant="h1">Oh No! Unauthorized</Typography>
        <Typography>
          It seems you are not authorized to access this page. Please log in to
          continue.
        </Typography>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          Go back home
        </Link>
        <SignInButton size="default" />
      </div>
    </main>
  );
}
