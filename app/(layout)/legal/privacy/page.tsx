import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Privacy Policy

**Last updated: July 18, 2026**

This Policy explains how MyCryptoPilot processes personal data in its risk-first demo and testnet scope. For privacy questions or requests, contact **hello@mycryptopilot.app**.

## 1. Data we process

Depending on the features you use, we may process:

- account data such as name, email address, authentication provider, and account preferences;
- security and technical data such as session identifiers, timestamps, error diagnostics, rate-limit events, and approximate device information;
- encrypted read-only exchange credentials and their permission status;
- portfolio, balance, and trade-history data returned by a connected exchange;
- risk simulations, sourced signal interactions, and connection-revocation history;
- messages you voluntarily send through support or contact forms.

MyCryptoPilot does not request wallet private keys, custody funds, execute orders, or process crypto payments in the retained public scope.

## 2. Why we process data

We process data only to:

- create and secure your account;
- provide read-only portfolio and risk-simulation features;
- verify that exchange permissions do not allow trading or withdrawals;
- diagnose failures, prevent abuse, and maintain service integrity;
- answer support requests and send necessary transactional emails;
- comply with legal obligations and exercise or defend legal claims.

Depending on the context, the legal basis is performance of the service you requested, our legitimate interest in securing and improving it, your consent for optional processing, or a legal obligation.

## 3. Exchange credentials and sensitive data

Exchange API credentials are encrypted before storage and are never intentionally logged in plaintext. Connections requiring trading or withdrawal permissions are rejected. You can revoke a connection in MyCryptoPilot and should also revoke the key directly in your exchange account.

We do not send API keys, portfolio contents, full trade history, or risk-simulation values to marketing analytics.

## 4. Providers and recipients

Data may be processed by service providers necessary to operate MyCryptoPilot, including hosting, PostgreSQL database, authentication, transactional email, error monitoring, and supported exchange APIs. Providers receive only the data required for their function and are subject to their own contractual and security obligations.

We do not sell personal data. We may disclose data when required by law or when necessary to protect users, the service, or our legal rights.

## 5. International transfers

Some providers may process data outside the European Economic Area. Where required, transfers rely on an adequacy decision, Standard Contractual Clauses, or another lawful safeguard.

## 6. Retention

Account and product data is retained while your account is active and then only as long as needed for security, legal, backup, or dispute-resolution purposes. Revoked connection records may retain non-secret audit metadata so revocation remains traceable. Encrypted credentials are no longer used after revocation.

Technical logs are retained for a limited operational period. Support messages may be kept while the request is handled and for a reasonable follow-up period. Backup deletion may be delayed by the provider's normal rotation cycle.

## 7. Security

We use access controls, server-side authorization, encryption in transit, encryption of exchange credentials at rest, secret redaction, and restricted production access. No system is perfectly secure; please report suspected incidents to **hello@mycryptopilot.app**.

## 8. Cookies and local storage

Strictly necessary cookies or browser storage may be used for authentication, security, locale, theme, and essential application state. Optional analytics, when enabled, must respect consent requirements and must not contain exchange secrets or portfolio payloads.

## 9. Your rights

Subject to applicable law, you may request access, correction, deletion, restriction, portability, or objection to processing. You may withdraw consent for optional processing at any time without affecting earlier lawful processing.

Requests can be sent to **hello@mycryptopilot.app**. We may need to verify your identity. If you are in the European Union, you may also complain to your competent data-protection authority, including the CNIL in France.

## 10. Children

MyCryptoPilot is not intended for anyone under 18. We do not knowingly create accounts for minors.

## 11. Changes

Material changes are dated on this page. If a change significantly affects your rights, we will provide an appropriate notice where required.

## 12. Contact

Privacy requests and questions can be sent to **hello@mycryptopilot.app** or through [the contact page](/contact).
`;

export const metadata: Metadata = {
  title: `${SiteConfig.title} - Privacy Policy`,
  description: "Privacy policy and data protection",
};

export const dynamic = "force-static";

export default function page() {
  return (
    <div>
      <div className="bg-card flex w-full items-center justify-center p-8 lg:p-12">
        <Typography variant="h1">Privacy</Typography>
      </div>
      <Layout>
        <LayoutContent className="typography m-auto mb-8">
          <MDXRemote source={markdown} />
        </LayoutContent>
      </Layout>
    </div>
  );
}
