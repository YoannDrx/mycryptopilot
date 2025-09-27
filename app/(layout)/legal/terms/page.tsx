import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `# Terms of Service

**Last Updated:** January 2025

## 1. Agreement to Terms

Welcome to MyCryptoPilot ("the Service"). By accessing or using our Service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Service.

## 2. Use License

Permission is granted to temporarily download one copy of MyCryptoPilot for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose, or for any public display (commercial or non-commercial)
- Attempt to decompile or reverse engineer any software contained on MyCryptoPilot
- Remove any copyright or other proprietary notations from the materials
- Transfer the materials to another person or "mirror" the materials on any other server

## 3. Disclaimer

The materials on MyCryptoPilot are provided on an 'as is' basis. MyCryptoPilot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 4. Limitations

In no event shall MyCryptoPilot or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MyCryptoPilot, even if MyCryptoPilot or an authorized representative has been notified orally or in writing of the possibility of such damage.

## 5. Accuracy of Materials

The materials appearing on MyCryptoPilot could include technical, typographical, or photographic errors. MyCryptoPilot does not warrant that any of the materials on its website are accurate, complete, or current. MyCryptoPilot may make changes to the materials contained on its website at any time without notice.

## 6. Trading and Investment Risks

### 6.1 High-Risk Warning
Cryptocurrency trading carries a high level of risk and may not be suitable for all investors. Before deciding to trade cryptocurrencies, you should carefully consider your investment objectives, level of experience, and risk appetite.

### 6.2 No Investment Advice
MyCryptoPilot provides tools and signals for informational purposes only and does not constitute investment advice. You are solely responsible for your investment decisions and should seek professional advice before making any investment decisions.

### 6.3 Past Performance
Past performance is not indicative of future results. Any historical or hypothetical performance results are presented for illustration purposes only.

### 6.4 Market Volatility
Cryptocurrency markets are extremely volatile and can fluctuate significantly in short periods. You acknowledge and accept the risks associated with cryptocurrency trading.

## 7. User Responsibilities

### 7.1 Account Security
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

### 7.2 Exchange API Keys
You are responsible for securing your exchange API keys and ensuring they have appropriate permissions. MyCryptoPilot is not responsible for any unauthorized access to your exchange accounts.

### 7.3 Compliance
You agree to comply with all applicable laws and regulations in your jurisdiction regarding cryptocurrency trading and use of automated trading systems.

## 8. Service Availability

### 8.1 Service Level
MyCryptoPilot strives to provide reliable service but does not guarantee uninterrupted availability. We reserve the right to modify, suspend, or discontinue the Service at any time.

### 8.2 Third-Party Services
Our Service integrates with third-party cryptocurrency exchanges. We are not responsible for the availability, accuracy, or reliability of these third-party services.

## 9. Payment and Billing

### 9.1 Subscription Fees
MyCryptoPilot offers subscription-based services with recurring billing. You authorize us to charge your payment method for the selected subscription plan.

### 9.2 Refunds
Refunds are handled according to our refund policy. Please contact our support team for refund requests.

### 9.3 Price Changes
We reserve the right to modify our pricing at any time with prior notice to existing subscribers.

## 10. Intellectual Property

All content, features, and functionality on MyCryptoPilot are the exclusive property of MyCryptoPilot SAS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

## 11. Termination

We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.

## 12. Governing Law

These Terms shall be governed and construed in accordance with the laws of France, without regard to its conflict of law provisions.

## 13. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.

## 14. Contact Information

If you have any questions about these Terms of Service, please contact us at:
- Email: legal@mycryptopilot.app
- Address: MyCryptoPilot SAS, 421 Rue de Paris, France

---

By using MyCryptoPilot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`;

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
