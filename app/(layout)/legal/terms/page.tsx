import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Terms of Service

**Last Updated: October 3, 2025**

Welcome to MyCryptoPilot. By accessing or using our platform, you agree to be bound by these Terms of Service.

## 1. Acceptance of Terms

By creating an account and using MyCryptoPilot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.

## 2. Description of Service

MyCryptoPilot is a platform that connects crypto traders with followers. Our services include:

- **For Users (Followers)**: Access to trading signals from verified traders, trading journal tools, and risk management calculators
- **For Traders**: Ability to publish trading signals, build a following, and earn revenue from subscribers
- **Payment Processing**: Crypto-only payments via USDC (Base network) or USDT (Tron network)

## 3. Eligibility

You must be at least 18 years old to use MyCryptoPilot. By using our service, you represent and warrant that:

- You are of legal age to enter into a binding agreement
- You have not been previously suspended or removed from our platform
- Your registration and use of the service complies with all applicable laws and regulations

## 4. Account Registration

### 4.1 Account Creation
- You must provide accurate, current, and complete information during registration
- You are responsible for maintaining the confidentiality of your account credentials
- You must not share your account with others or allow others to access your account
- You must notify us immediately of any unauthorized access to your account

### 4.2 Account Types
- **User Account**: Standard account to follow traders and receive signals
- **Trader Account**: Account to publish trading signals and build a following

## 5. Subscription Plans and Payments

### 5.1 Available Plans
MyCryptoPilot offers three subscription plans:
- **Free**: Limited access (5 signals/day, 1 trader to follow)
- **Pro ($49/month)**: Enhanced access (50 signals/day, 5 traders, risk console, trading journal)
- **Ultra ($99/month)**: Unlimited access (unlimited signals, unlimited traders, custom alerts, advanced filters)

### 5.2 Crypto Payments
- All payments are processed in cryptocurrency (USDC on Base or USDT on Tron)
- Payments are final and non-refundable once blockchain confirmations are complete
- Pro-rata subscriptions are supported (partial payments grant proportional access)
- Your subscription activates automatically upon payment confirmation (1 confirmation for Base, 2 for Tron)

### 5.3 Subscription Renewal
- Subscriptions do NOT auto-renew
- To extend your subscription, send additional crypto to your unique payment address
- Your subscription expires at the end of your paid period unless you manually top up
- You remain in control of your subscription duration

### 5.4 Cancellation
- You may cancel at any time by simply stopping payments
- No cancellation process required
- You retain access until the end of your paid period
- No refunds for unused portion of subscription

## 6. Trading Signals Disclaimer

### 6.1 Not Financial Advice
**IMPORTANT**: Trading signals provided on MyCryptoPilot are for informational and educational purposes only. They do NOT constitute financial, investment, trading, or any other type of advice.

### 6.2 Risk Acknowledgment
You acknowledge and understand that:
- **Cryptocurrency trading carries substantial risk of loss**
- Past performance does not guarantee future results
- You may lose your entire investment
- You should only trade with money you can afford to lose
- You are solely responsible for your trading decisions

### 6.3 No Guarantees
- We do not guarantee the accuracy, completeness, or timeliness of any trading signals
- We do not guarantee any specific outcomes or profits
- Trader statistics (win rate, profit factor, etc.) are historical and may not reflect future performance

### 6.4 Due Diligence
- You must perform your own research and due diligence before executing any trade
- You should consult with qualified financial advisors before making investment decisions
- You should understand the risks associated with each trade

## 7. Trader Obligations

### 7.1 Signal Publishing
If you are a Trader, you agree to:
- Publish signals in good faith based on your analysis
- Not manipulate or falsify trading statistics
- Not engage in pump-and-dump schemes or market manipulation
- Disclose any conflicts of interest
- Comply with all applicable securities and trading regulations

### 7.2 Revenue and Commissions
- MyCryptoPilot may charge a platform commission on trader revenues
- Commission rates are subject to change with 30 days notice
- Traders are responsible for their own tax reporting and compliance

### 7.3 Verification
- Verified status is granted at MyCryptoPilot's sole discretion
- Verified status may be revoked if traders violate these Terms
- Verification criteria include: complete profile, 10+ signals, 5+ followers, account age 30+ days

## 8. Prohibited Activities

You agree NOT to:
- Violate any applicable laws or regulations
- Infringe on intellectual property rights of others
- Transmit viruses, malware, or harmful code
- Attempt to gain unauthorized access to our systems
- Scrape, harvest, or collect data from our platform without permission
- Manipulate or artificially inflate follower counts or statistics
- Create multiple accounts to circumvent plan limitations
- Engage in wash trading or other fraudulent activities
- Harass, threaten, or abuse other users
- Impersonate others or provide false information

## 9. Intellectual Property

### 9.1 Platform Content
All content on MyCryptoPilot (excluding user-generated content) is owned by MyCryptoPilot and protected by copyright, trademark, and other intellectual property laws.

### 9.2 User Content
- You retain ownership of the trading signals and content you publish
- By publishing content, you grant MyCryptoPilot a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on our platform
- You represent that you have all necessary rights to publish your content

### 9.3 Trademarks
"MyCryptoPilot" and our logo are trademarks of MyCryptoPilot. You may not use our trademarks without prior written permission.

## 10. Privacy and Data Protection

Your privacy is important to us. Please review our [Privacy Policy](/legal/privacy) to understand how we collect, use, and protect your personal information.

## 11. Disclaimers and Limitations of Liability

### 11.1 Service "AS IS"
MyCryptoPilot is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to:
- Warranties of merchantability
- Fitness for a particular purpose
- Non-infringement
- Accuracy or reliability

### 11.2 No Warranty of Results
We do not warrant that:
- The service will meet your requirements
- The service will be uninterrupted, timely, secure, or error-free
- The results obtained from using the service will be accurate or reliable
- Any trading signals will be profitable

### 11.3 Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, MYCRYPTOPILOT SHALL NOT BE LIABLE FOR ANY:
- INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
- LOST PROFITS, LOST DATA, OR LOST OPPORTUNITIES
- TRADING LOSSES OR INVESTMENT LOSSES
- DAMAGES RESULTING FROM UNAUTHORIZED ACCESS TO YOUR ACCOUNT

IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO MYCRYPTOPILOT IN THE 12 MONTHS PRECEDING THE CLAIM.

### 11.4 Third-Party Services
We are not responsible for the availability, accuracy, or reliability of:
- Blockchain networks (Base, Tron)
- Cryptocurrency exchanges
- Price data providers
- Any third-party services integrated into our platform

## 12. Indemnification

You agree to indemnify, defend, and hold harmless MyCryptoPilot, its officers, directors, employees, and agents from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from:
- Your use of the service
- Your violation of these Terms
- Your trading activities based on signals from our platform
- Your violation of any rights of others

## 13. Termination

### 13.1 Termination by You
You may terminate your account at any time by:
- Stopping payments (your subscription will expire naturally)
- Deleting your account in settings (permanent and irreversible)

### 13.2 Termination by Us
We may suspend or terminate your account immediately, without prior notice, if:
- You violate these Terms of Service
- You engage in fraudulent activities
- We suspect unauthorized or illegal use of your account
- Required by law or regulatory authority

### 13.3 Effect of Termination
Upon termination:
- Your access to the service will cease immediately
- Your subscription will be forfeited without refund
- Your data may be deleted in accordance with our data retention policies
- Provisions that by their nature should survive (indemnification, disclaimers, limitations of liability) will continue to apply

## 14. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify you of material changes by:
- Posting a notice on our website
- Sending an email to your registered email address
- Displaying an in-app notification

Your continued use of MyCryptoPilot after changes constitute acceptance of the revised Terms.

## 15. Dispute Resolution

### 15.1 Governing Law
These Terms shall be governed by and construed in accordance with the laws of [JURISDICTION TO BE DETERMINED], without regard to conflict of law principles.

### 15.2 Arbitration
Any disputes arising from these Terms or your use of MyCryptoPilot shall be resolved through binding arbitration, except that:
- Either party may seek injunctive relief in court
- You may bring claims in small claims court if they qualify

### 15.3 Class Action Waiver
You agree to resolve disputes with MyCryptoPilot on an individual basis. You waive any right to participate in class actions or class arbitrations.

## 16. Severability

If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.

## 17. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and MyCryptoPilot regarding the use of our service.

## 18. Contact Information

If you have questions about these Terms, please contact us:

**Email**: legal@mycryptopilot.app
**Website**: https://mycryptopilot.app/contact

---

**By using MyCryptoPilot, you acknowledge that you have read, understood, and agree to these Terms of Service.**
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
