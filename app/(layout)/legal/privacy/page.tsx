import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `# Privacy Policy

**Last Updated:** January 2025

## 1. Introduction

MyCryptoPilot SAS ("we", "us", or "our") operates the mycryptopilot.app website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.

## 2. Information Collection and Use

### 2.1 Types of Data Collected

#### Personal Data
While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:

- Email address
- First name and last name
- Phone number
- Address, State, Province, ZIP/Postal code, City
- Cookies and Usage Data

#### Usage Data
We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol (IP) address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.

#### Trading Data
When you connect your exchange accounts, we collect and process:
- Exchange API keys (encrypted and stored securely)
- Trading history and performance data
- Portfolio balances and asset allocations
- Automated trading strategy configurations

#### Tracking & Cookies Data
We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.

### 2.2 Use of Data

MyCryptoPilot uses the collected data for various purposes:

- To provide and maintain the Service
- To notify you about changes to our Service
- To allow you to participate in interactive features of our Service when you choose to do so
- To provide customer care and support
- To provide analysis or valuable information so that we can improve the Service
- To monitor the usage of the Service
- To detect, prevent and address technical issues
- To process payments and manage subscriptions
- To generate trading signals and analytics

## 3. Data Security

The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

### 3.1 API Key Security
- Exchange API keys are encrypted using AES-256 encryption
- Keys are stored in secure, isolated environments
- We implement the principle of least privilege for API permissions
- Regular security audits and penetration testing

### 3.2 Data Encryption
- All data transmitted between your device and our servers is encrypted using TLS 1.3
- Sensitive data at rest is encrypted using industry-standard encryption algorithms
- Database access is restricted and monitored

## 4. Service Providers

We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.

These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.

### 4.1 Third-Party Services
- **Payment Processors:** Stripe for payment processing
- **Email Services:** Resend for email delivery
- **Analytics:** (Optional) Google Analytics for usage analytics
- **Cryptocurrency Exchanges:** Binance, Bybit, OKX, Bitget for trading integration

## 5. Data Retention

MyCryptoPilot will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.

### 5.1 Specific Retention Periods
- User account data: Retained until account deletion
- Trading history: Retained for 7 years for compliance purposes
- API logs: Retained for 90 days
- Usage analytics: Retained for 2 years

## 6. Data Transfer

Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.

## 7. Disclosure of Data

### 7.1 Legal Requirements
MyCryptoPilot may disclose your Personal Data in the good faith belief that such action is necessary to:

- To comply with a legal obligation
- To protect and defend the rights or property of MyCryptoPilot
- To prevent or investigate possible wrongdoing in connection with the Service
- To protect the personal safety of users of the Service or the public
- To protect against legal liability

### 7.2 Business Transfers
If MyCryptoPilot is involved in a merger, acquisition or asset sale, your Personal Data may be transferred. We will provide notice before your Personal Data is transferred and becomes subject to a different Privacy Policy.

## 8. Your Data Protection Rights

You have certain data protection rights. We aim to take reasonable measures to allow you to correct, amend, delete, or limit the use of your Personal Data.

### 8.1 Rights of Data Subjects
- **Right to Access:** Request copies of your personal data
- **Right to Rectification:** Request correction of inaccurate personal data
- **Right to Erasure:** Request deletion of your personal data
- **Right to Restrict Processing:** Request limitation of processing
- **Right to Data Portability:** Request transfer of data to another service
- **Right to Object:** Object to processing of personal data

### 8.2 Account Management
You can manage your data and privacy settings through:
- Your account dashboard
- Data export functionality
- Account deletion option
- Privacy preferences

## 9. Children's Privacy

Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.

## 10. Links to Other Sites

Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.

## 11. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.

You are advised to review this Privacy Policy periodically for any changes.

## 12. GDPR Compliance

### 12.1 Lawful Basis for Processing
We process personal data based on the following lawful bases:
- Consent: When you explicitly agree to data processing
- Contract necessity: To provide our services under our agreement
- Legitimate interests: For service improvement and security
- Legal obligations: When required by law

### 12.2 Data Subject Rights under GDPR
As a data subject under GDPR, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Not be subject to automated decision-making

### 12.3 Data Protection Officer
For GDPR-related inquiries, please contact our Data Protection Officer at:
dpo@mycryptopilot.app

## 13. International Data Transfers

As a global service, we may transfer data internationally. We ensure adequate protection through:
- Standard Contractual Clauses (SCCs)
- EU-U.S. Data Privacy Framework certification
- Binding corporate rules where applicable

## 14. Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **Email:** privacy@mycryptopilot.app
- **Data Protection Officer:** dpo@mycryptopilot.app
- **Address:** MyCryptoPilot SAS, 421 Rue de Paris, France
- **Phone:** +33 1 23 45 67 89

## 15. Data Breach Notification

In the event of a data breach that affects your personal data, we will notify you:
- Within 72 hours of becoming aware of the breach (as required by GDPR)
- Via email to your registered email address
- With details of what happened and what steps we're taking
- With guidance on how you can protect yourself

---

By using MyCryptoPilot, you acknowledge that you have read, understood, and agree to our collection and use of your personal information as described in this Privacy Policy.`;

export const metadata: Metadata = {
  title: `${SiteConfig.title} - Privacy Policy`,
  description: "Privacy policy for MyCryptoPilot crypto trading platform",
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
