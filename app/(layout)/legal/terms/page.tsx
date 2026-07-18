import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Terms of Service

**Last updated: July 18, 2026**

These Terms govern access to MyCryptoPilot. By creating an account or using the service, you agree to them and to the Privacy Policy.

## 1. Scope of the service

MyCryptoPilot is a risk-first technical demonstrator. Its retained public scope is limited to:

- simulating position size, potential loss, and risk/reward;
- inspecting sourced or clearly labelled example signals;
- viewing portfolio data from supported exchange connections in read-only mode;
- documenting the architecture and security boundaries of those features.

MyCryptoPilot does **not** execute trades, copy trades, hold funds, manage wallets, process crypto payments, sell subscriptions, or promise returns. Demo and testnet data is labelled as such.

## 2. No financial advice

All information is provided for technical, educational, and informational purposes. It is not financial, investment, legal, tax, or trading advice. Cryptocurrency markets can result in a total loss. You remain solely responsible for any decision made outside MyCryptoPilot.

## 3. Eligibility and accounts

You must be at least 18 years old and legally able to accept these Terms. You must provide accurate account information, protect your credentials, and notify us if you suspect unauthorized access.

We may suspend or remove accounts used to harm the service, bypass security controls, impersonate another person, or violate applicable law.

## 4. Read-only exchange connections

Only read-only API credentials are accepted. Credentials with trading or withdrawal permissions are rejected. You are responsible for creating appropriately restricted keys and revoking them from the exchange when they are no longer needed.

Exchange credentials are encrypted before storage. A successful connection does not authorize MyCryptoPilot to place an order, withdraw funds, or act on your behalf. Availability and data freshness also depend on the exchange provider.

## 5. Acceptable use

You must not:

- attempt to obtain another user's data or credentials;
- probe, overload, reverse engineer, or bypass access controls except under a written security-testing agreement;
- submit malware, unlawful content, or intentionally false identity information;
- present demo output as a guaranteed or verified investment result;
- use the service in violation of sanctions, export controls, or other applicable law.

## 6. Data and third-party services

The Privacy Policy explains the data we process and your rights. MyCryptoPilot relies on third-party hosting, database, email, authentication, and exchange services. Their outages, API changes, rate limits, and data corrections may affect the service.

Third-party names and trademarks belong to their respective owners. Their presence does not imply sponsorship or endorsement.

## 7. Availability and changes

The service is provided as a demonstrator and may change, be limited, or be discontinued. We aim to preserve account export and deletion paths but do not guarantee uninterrupted or error-free availability.

Material changes to these Terms will be dated on this page. Continuing to use the service after a change means accepting the updated Terms where permitted by law.

## 8. Intellectual property

MyCryptoPilot's original interface, documentation, and code remain protected by applicable intellectual-property law. You retain ownership of information you submit. You grant us only the rights necessary to operate, secure, and support the service.

## 9. Disclaimer and liability

To the maximum extent permitted by law, MyCryptoPilot is provided "as is" without a guarantee of profit, accuracy, fitness for a particular trading strategy, or continuous availability. Nothing in these Terms excludes liability that cannot legally be excluded.

## 10. Termination

You may stop using the service and request account deletion at any time. We may restrict access when necessary to protect users, infrastructure, or legal compliance. Provisions that must logically survive termination, including intellectual property, disclaimers, and liability limits, continue to apply.

## 11. Applicable law

These Terms are governed by applicable French law, without limiting any mandatory consumer protection available in your country of residence. Competent courts are determined by mandatory law.

## 12. Contact

Questions about these Terms can be sent to **hello@mycryptopilot.app** or through [the contact page](/contact).
`;

export const metadata: Metadata = {
  title: `${SiteConfig.title} - Terms`,
  description: "Terms of service",
};

export const dynamic = "force-static";

export default function page() {
  return (
    <div>
      <div className="bg-card flex w-full items-center justify-center p-8 lg:p-12">
        <Typography variant="h1">Terms</Typography>
      </div>
      <Layout>
        <LayoutContent className="typography m-auto mb-8">
          <MDXRemote source={markdown} />
        </LayoutContent>
      </Layout>
    </div>
  );
}
