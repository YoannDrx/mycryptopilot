import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Privacy Policy

**Last Updated: October 3, 2025**

MyCryptoPilot ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

## 1. Information We Collect

### 1.1 Information You Provide

**Account Information**
- Email address
- Full name
- Profile picture (optional)
- Organization name (auto-generated, 1 per user)

**Trader Profile Information** (if you become a trader)
- Display name
- Biography
- Monthly pricing
- Trading statistics (win rate, profit factor, etc.)

**Trading Journal Data** (if you use the journal feature)
- Trade entries (symbol, entry/exit prices, PnL, notes)
- Personal trading statistics
- Tags and annotations

**Payment Information**
- Cryptocurrency addresses (generated for your payments)
- Transaction hashes (txHash) for payment tracking
- Payment amounts and dates
- Subscription plan information

### 1.2 Information Automatically Collected

**Technical Information**
- IP address
- Browser type and version
- Device type and operating system
- Pages visited and features used
- Date and time of access
- Referral source

**Session Information**
- Login/logout times
- Active session tokens
- User agent information

**Blockchain Data**
- Crypto addresses generated for your account
- Transaction data from blockchain networks (public data)
- Payment confirmations

### 1.3 Information from Third Parties

**OAuth Providers** (if you sign up via social login)
- GitHub, Google, or Discord profile information
- Email address
- Profile picture
- Public profile data (as authorized by you)

**Market Data Providers** (for screeners and price data)
- Cryptocurrency prices
- Market statistics
- No personal data shared with these providers

## 2. How We Use Your Information

### 2.1 To Provide Our Services
- Create and manage your account
- Process subscription payments via crypto
- Enable you to follow traders and view signals
- Allow traders to publish signals
- Display trading statistics and analytics
- Maintain your trading journal
- Calculate risk metrics

### 2.2 To Improve Our Platform
- Analyze usage patterns to enhance features
- Debug technical issues
- Optimize performance
- Develop new features

### 2.3 To Communicate With You
- Send transactional emails (payment confirmations, account updates)
- Send trading signal notifications (if enabled in preferences)
- Respond to your support requests
- Send important platform updates
- **Marketing emails only with your explicit consent**

### 2.4 To Ensure Security
- Detect and prevent fraud
- Monitor for suspicious activities
- Protect against unauthorized access
- Enforce our Terms of Service

### 2.5 Legal Compliance
- Comply with applicable laws and regulations
- Respond to legal requests and court orders
- Protect our legal rights

## 3. How We Share Your Information

### 3.1 Information We Share Publicly

**Trader Public Profiles**
If you are a trader, the following information is publicly visible:
- Display name
- Avatar
- Biography
- Monthly price
- Trading statistics (win rate, profit factor, followers count)
- Trading signals you publish
- Verified status

**User Information**
Standard users have limited public profile information:
- Name (if you follow a trader)
- Avatar (if set)

### 3.2 Third-Party Service Providers

We share information with trusted third parties who help us operate:

**Infrastructure Providers**
- Database hosting (Vercel/Neon PostgreSQL)
- Application hosting (Vercel)
- CDN and storage (for images)

**Email Service**
- Resend (for transactional and notification emails)
- Your email and name are shared to send emails

**Payment Processing**
- Blockchain RPC providers (Alchemy, Infura, TronGrid)
- **No personal information shared** - only crypto addresses (public data)

**Analytics** (if implemented)
- Usage analytics providers
- Anonymized or aggregated data only

**OAuth Providers**
- GitHub, Google, Discord (only when you use social login)

### 3.3 Legal Requirements

We may disclose your information if required to:
- Comply with a subpoena, court order, or legal process
- Enforce our Terms of Service
- Protect our rights, property, or safety
- Prevent fraud or illegal activities
- Comply with regulatory requirements

### 3.4 Business Transfers

If MyCryptoPilot is acquired, merged, or undergoes a business transfer, your information may be transferred to the acquiring entity. You will be notified of any such change.

### 3.5 With Your Consent

We may share information in other circumstances with your explicit consent.

## 4. Data Retention

### 4.1 Active Accounts
We retain your information for as long as your account is active or as needed to provide services.

### 4.2 Inactive Accounts
If your account is inactive for 24 months, we may delete or anonymize your data after notifying you.

### 4.3 Legal Requirements
We may retain certain information longer if required by law or for legitimate business purposes (e.g., fraud prevention, dispute resolution).

### 4.4 Trading Signals
Published trading signals may be retained for historical purposes even after your account is deleted, but will be anonymized.

### 4.5 Blockchain Data
Cryptocurrency transactions are permanently recorded on public blockchains and cannot be deleted by us.

## 5. Your Rights and Choices

### 5.1 Access and Update
You can access and update your account information at any time through your account settings.

### 5.2 Delete Your Account
You can permanently delete your account from the "Danger Zone" in settings. This action is irreversible.

**What happens when you delete:**
- Your account is permanently deleted
- Your personal information is removed from our active databases
- Published trading signals are anonymized
- Crypto payment records may be retained for legal/accounting purposes

### 5.3 Email Preferences
You can control email notifications in your account settings:
- Trading signal notifications
- New follower notifications
- Payment confirmations (cannot be disabled for security)

### 5.4 Data Portability
You can export your trading journal data as CSV from the Trading Journal page.

### 5.5 Data Access Request
You may request a copy of your personal data by contacting privacy@mycryptopilot.app.

### 5.6 Correction
If you believe any information we hold is inaccurate, you can update it in settings or contact us for assistance.

### 5.7 Right to Object
You can object to certain processing of your data by contacting us at privacy@mycryptopilot.app.

## 6. Security Measures

We implement industry-standard security measures to protect your information:

### 6.1 Technical Safeguards
- **Encryption**: Data in transit protected via HTTPS/TLS
- **Password Security**: Passwords hashed using bcrypt
- **Session Management**: Secure session tokens with expiration
- **Database Security**: Access controls and encrypted connections
- **Private Keys**: Never stored (HD wallet derivation from xpub only)

### 6.2 Organizational Safeguards
- Limited employee access to personal data
- Regular security audits
- Incident response procedures

### 6.3 Your Responsibilities
- Use a strong, unique password
- Enable two-factor authentication (if available)
- Keep your account credentials confidential
- Log out from shared devices
- Report suspicious activity immediately

**Note**: No security is 100% guaranteed. You use MyCryptoPilot at your own risk.

## 7. Cookies and Tracking Technologies

### 7.1 Cookies We Use

**Essential Cookies** (required for platform functionality)
- Authentication session cookies
- Security tokens
- User preferences (theme, language)

**Analytics Cookies** (if implemented, with your consent)
- Usage analytics
- Performance monitoring

### 7.2 Managing Cookies
You can control cookies through your browser settings. Note that disabling essential cookies may affect platform functionality.

### 7.3 Third-Party Cookies
Third-party services (OAuth providers, analytics) may set their own cookies. We do not control these cookies.

## 8. International Data Transfers

MyCryptoPilot operates globally. Your information may be transferred to and processed in countries other than your own.

**Data Transfer Safeguards**:
- We use reputable infrastructure providers with strong data protection
- Data transfers comply with applicable data protection laws
- Standard contractual clauses where required

## 9. Children's Privacy

MyCryptoPilot is NOT intended for users under 18 years old. We do not knowingly collect information from children.

If you believe a child has provided us with information, please contact us immediately at privacy@mycryptopilot.app and we will delete the information.

## 10. California Privacy Rights (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

### 10.1 Right to Know
You have the right to request:
- Categories of personal information we collect
- Sources of the information
- Business purposes for collecting
- Categories of third parties we share with
- Specific pieces of information we hold

### 10.2 Right to Delete
You have the right to request deletion of your personal information, subject to certain exceptions.

### 10.3 Right to Opt-Out
You have the right to opt-out of the "sale" of personal information. **Note**: We do NOT sell your personal information.

### 10.4 Non-Discrimination
We will not discriminate against you for exercising your CCPA rights.

### 10.5 How to Exercise Rights
Email: privacy@mycryptopilot.app with subject "CCPA Request"

## 11. European Privacy Rights (GDPR)

If you are in the European Economic Area (EEA), UK, or Switzerland, you have rights under the General Data Protection Regulation (GDPR):

### 11.1 Legal Bases for Processing
We process your data based on:
- **Contractual Necessity**: To provide our services
- **Legitimate Interests**: To improve and secure our platform
- **Consent**: For marketing communications (where required)
- **Legal Obligations**: To comply with laws

### 11.2 Your GDPR Rights
- Right to access your data
- Right to rectification (correction)
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object to processing
- Right to withdraw consent

### 11.3 Data Protection Officer
Contact our Data Protection Officer at dpo@mycryptopilot.app

### 11.4 Supervisory Authority
You have the right to lodge a complaint with your local data protection authority.

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:
- Posting the new Privacy Policy on this page
- Updating the "Last Updated" date
- Sending an email notification (for significant changes)
- Displaying an in-app notification

Your continued use after changes constitutes acceptance of the updated Privacy Policy.

## 13. Third-Party Links

Our platform may contain links to third-party websites or services (e.g., blockchain explorers, exchanges). We are not responsible for their privacy practices. Please review their privacy policies.

## 14. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your personal information:

**Email**: privacy@mycryptopilot.app
**General Contact**: https://mycryptopilot.app/contact

**For specific requests**:
- **Data Access**: privacy@mycryptopilot.app (subject: "Data Access Request")
- **Data Deletion**: privacy@mycryptopilot.app (subject: "Data Deletion Request")
- **CCPA Requests**: privacy@mycryptopilot.app (subject: "CCPA Request")
- **GDPR Requests**: dpo@mycryptopilot.app (subject: "GDPR Request")
- **Security Issues**: security@mycryptopilot.app

## 15. Blockchain and Crypto Specific

### 15.1 Public Blockchain Data
Cryptocurrency transactions are permanently recorded on public blockchains (Base, Tron). This data includes:
- Your crypto address
- Transaction amounts
- Transaction timestamps
- **This data is PUBLIC and PERMANENT** - we cannot delete or modify it

### 15.2 Privacy Coins
MyCryptoPilot currently does NOT support privacy coins (Monero, Zcash, etc.). We only accept USDC (Base) and USDT (Tron).

### 15.3 Wallet Addresses
- Crypto addresses generated for you are derived from extended public keys (xpub)
- **Private keys are NEVER stored or accessible**
- Addresses are unique per user
- You can request to deactivate addresses at any time

### 15.4 On-Chain Analytics
While your transactions are public on the blockchain, we do not actively track or analyze your on-chain activity beyond what is necessary to confirm payments to our platform.

---

**By using MyCryptoPilot, you acknowledge that you have read and understood this Privacy Policy.**

For questions, contact: privacy@mycryptopilot.app
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
