import { SiteConfig } from "@/site-config";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { PropsWithChildren } from "react";

// Logo MyCryptoPilot - URL de production (fond transparent)
const LOGO_URL = "https://mycryptopilot.app/images/logo-transparent.png";

/**
 * EmailLayout is used to create a layout for your email.
 * @param props.children The children of the layout
 * @param props.disableTailwind If true, the children will be rendered without the Tailwind CSS. It's useful when you want use <Markdown /> tag.
 * @returns
 */
export const EmailLayout = (
  props: PropsWithChildren<{ disableTailwind?: boolean }>,
) => {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#f8fafc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          margin: 0,
          padding: "20px 0",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden",
            maxWidth: "600px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Header */}
          <Tailwind>
            <Section
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "24px",
              }}
            >
              <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td style={{ verticalAlign: "middle" }}>
                    <table cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td style={{ paddingRight: "12px" }}>
                          <Img
                            src={LOGO_URL}
                            width={40}
                            height={40}
                            alt={`${SiteConfig.title}'s logo`}
                            style={{ display: "block" }}
                          />
                        </td>
                        <td>
                          <Text
                            style={{
                              fontSize: "22px",
                              fontWeight: "700",
                              margin: 0,
                              lineHeight: "1",
                            }}
                          >
                            <span style={{ color: "#ffffff" }}>MyCrypto</span>
                            <span style={{ color: "#10b981" }}>Pilot</span>
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                    <Text
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Risk-First Trading
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>
          </Tailwind>

          {/* Content */}
          <Section style={{ padding: "32px 24px" }}>
            {props.disableTailwind ? (
              props.children
            ) : (
              <Tailwind>{props.children}</Tailwind>
            )}
          </Section>

          {/* Footer */}
          <Tailwind>
            <Section
              style={{
                backgroundColor: "#f8fafc",
                padding: "24px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {/* Logo and tagline */}
              <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td>
                    <table cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td style={{ paddingRight: "8px" }}>
                          <Img
                            src={LOGO_URL}
                            width={24}
                            height={24}
                            alt={`${SiteConfig.title}'s logo`}
                            style={{ display: "block" }}
                          />
                        </td>
                        <td>
                          <Text
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              margin: 0,
                              color: "#1e293b",
                            }}
                          >
                            <span>MyCrypto</span>
                            <span style={{ color: "#10b981" }}>Pilot</span>
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <Text
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "12px 0 0 0",
                }}
              >
                Crypto trading signals with a risk-first approach.
              </Text>

              <Hr
                style={{
                  borderColor: "#e2e8f0",
                  margin: "16px 0",
                }}
              />

              {/* Links */}
              <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td>
                    <Link
                      href={`${SiteConfig.prodUrl}/traders`}
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        textDecoration: "none",
                        marginRight: "16px",
                      }}
                    >
                      Marketplace
                    </Link>
                    <Link
                      href={`${SiteConfig.prodUrl}/orgs/pricing`}
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        textDecoration: "none",
                        marginRight: "16px",
                      }}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="https://discord.gg/mycryptopilot"
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        textDecoration: "none",
                      }}
                    >
                      Discord
                    </Link>
                  </td>
                </tr>
              </table>

              <Hr
                style={{
                  borderColor: "#e2e8f0",
                  margin: "16px 0",
                }}
              />

              {/* Company info */}
              <Text
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  margin: "0 0 4px 0",
                }}
              >
                {SiteConfig.company.name} • {SiteConfig.company.address}
              </Text>
              <Text
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  margin: 0,
                }}
              >
                Contact:{" "}
                <Link
                  href={`mailto:${SiteConfig.email.contact}`}
                  style={{ color: "#10b981" }}
                >
                  {SiteConfig.email.contact}
                </Link>
              </Text>
            </Section>
          </Tailwind>
        </Container>
      </Body>
    </Html>
  );
};
