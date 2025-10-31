import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type SweepTransaction = {
  network: "BASE" | "TRON";
  amount: string;
  currency: string;
  txHash: string;
  explorerUrl: string;
  timestamp: Date;
};

type SweepNotificationEmailProps = {
  transactions: SweepTransaction[];
  totalAmountUSD: number;
  binanceWallets: {
    base?: string;
    tron?: string;
  };
};

export const SweepNotificationEmail = ({
  transactions,
  totalAmountUSD,
  binanceWallets,
}: SweepNotificationEmailProps) => {
  const baseTransactions = transactions.filter((tx) => tx.network === "BASE");
  const tronTransactions = transactions.filter((tx) => tx.network === "TRON");

  return (
    <Html>
      <Head />
      <Preview>
        Sweep completed - ${totalAmountUSD.toFixed(2)} transferred to Binance
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🧹 Sweep Completed Successfully</Heading>

          <Text style={text}>
            Your crypto funds have been successfully swept from payment
            addresses to your Binance wallets.
          </Text>

          {/* Summary Section */}
          <Section style={summaryBox}>
            <Heading as="h2" style={h2}>
              📊 Summary
            </Heading>
            <Text style={summaryText}>
              <strong>Total Swept:</strong> ${totalAmountUSD.toFixed(2)} USD
            </Text>
            <Text style={summaryText}>
              <strong>Transactions:</strong> {transactions.length} sweep
              {transactions.length > 1 ? "s" : ""}
            </Text>
            <Text style={summaryText}>
              <strong>Time:</strong> {new Date().toLocaleString()}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Base Network Transactions */}
          {baseTransactions.length > 0 && (
            <>
              <Heading as="h2" style={h2}>
                🟦 Base Network (USDC)
              </Heading>
              <Text style={text}>
                <strong>{baseTransactions.length}</strong> transaction
                {baseTransactions.length > 1 ? "s" : ""} swept to:{" "}
                <code style={code}>{binanceWallets.base}</code>
              </Text>

              {baseTransactions.map((tx, index) => (
                <Section key={index} style={transactionBox}>
                  <Text style={transactionText}>
                    <strong>Amount:</strong> {tx.amount} {tx.currency}
                  </Text>
                  <Text style={transactionText}>
                    <strong>TX Hash:</strong>{" "}
                    <code style={codeSmall}>{tx.txHash.slice(0, 20)}...</code>
                  </Text>
                  <Link href={tx.explorerUrl} style={link}>
                    View on BaseScan →
                  </Link>
                </Section>
              ))}

              <Hr style={hr} />
            </>
          )}

          {/* Tron Network Transactions */}
          {tronTransactions.length > 0 && (
            <>
              <Heading as="h2" style={h2}>
                🟣 Tron Network (USDT)
              </Heading>
              <Text style={text}>
                <strong>{tronTransactions.length}</strong> transaction
                {tronTransactions.length > 1 ? "s" : ""} swept to:{" "}
                <code style={code}>{binanceWallets.tron}</code>
              </Text>

              {tronTransactions.map((tx, index) => (
                <Section key={index} style={transactionBox}>
                  <Text style={transactionText}>
                    <strong>Amount:</strong> {tx.amount} {tx.currency}
                  </Text>
                  <Text style={transactionText}>
                    <strong>TX Hash:</strong>{" "}
                    <code style={codeSmall}>{tx.txHash.slice(0, 20)}...</code>
                  </Text>
                  <Link href={tx.explorerUrl} style={link}>
                    View on TronScan →
                  </Link>
                </Section>
              ))}

              <Hr style={hr} />
            </>
          )}

          {/* Next Steps */}
          <Section>
            <Heading as="h2" style={h2}>
              📝 Next Steps
            </Heading>
            <Text style={text}>
              1. Verify funds arrived in your Binance account
              <br />
              2. Convert USDC/USDT to EUR if needed
              <br />
              3. Withdraw to your bank account
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            This is an automated notification from MyCryptoPilot sweep system.
            <br />
            If you have any questions, please contact support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SweepNotificationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 40px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 15px",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const summaryBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 40px 20px",
};

const summaryText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const transactionBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "15px",
  margin: "0 40px 15px",
  borderLeft: "4px solid #3b82f6",
};

const transactionText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "6px 0",
};

const code = {
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "14px",
  fontFamily: "monospace",
  color: "#1f2937",
};

const codeSmall = {
  ...code,
  fontSize: "12px",
};

const link = {
  color: "#3b82f6",
  fontSize: "14px",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "30px 40px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  textAlign: "center" as const,
};
