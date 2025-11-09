import { SiteConfig } from "@/site-config";
import { Markdown, Preview, Text } from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

export default function BilingualMarkdownEmail(props: {
  markdownEN: string;
  markdownFR: string;
  preview?: string;
  disabledSignature?: boolean;
}) {
  // Add signature to both versions if not disabled
  let englishMarkdown = props.markdownEN;
  let frenchMarkdown = props.markdownFR;

  if (!props.disabledSignature) {
    englishMarkdown += `

Best,\n
${SiteConfig.team.name} from ${SiteConfig.title}
    `;

    frenchMarkdown += `

Cordialement,\n
${SiteConfig.team.name} de ${SiteConfig.title}
    `;
  }

  // Normalize markdown by removing leading/trailing spaces from each line
  englishMarkdown = englishMarkdown
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  frenchMarkdown = frenchMarkdown
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return (
    <EmailLayout disableTailwind>
      <Preview>{props.preview ?? "You have a new message"}</Preview>

      {/* English Section */}
      <Text
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#4b5563",
          marginBottom: "0.75rem",
          marginTop: "1rem",
        }}
      >
        🇬🇧 English
      </Text>
      <Markdown
        markdownCustomStyles={{
          p: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          li: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          link: {
            color: "#6366f1",
          },
        }}
      >
        {englishMarkdown}
      </Markdown>

      {/* Horizontal Separator */}
      <hr
        style={{
          marginTop: "2rem",
          marginBottom: "2rem",
          borderColor: "#d1d5db",
          borderWidth: "1px",
          borderStyle: "solid",
        }}
      />

      {/* French Section */}
      <Text
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#4b5563",
          marginBottom: "0.75rem",
        }}
      >
        🇫🇷 Français
      </Text>
      <Markdown
        markdownCustomStyles={{
          p: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          li: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          link: {
            color: "#6366f1",
          },
        }}
      >
        {frenchMarkdown}
      </Markdown>
    </EmailLayout>
  );
}
