import AuthNavigationWrapper from "@/features/navigation/LogInNavigationWrapper";
import { Page400 } from "@/features/page/Page400";

export default function NotFoundPage() {
  return (
    <AuthNavigationWrapper>
      <Page400 />
    </AuthNavigationWrapper>
  );
}
