import { SiteConfig } from "@/site-config";
import { Markdown, Preview } from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

export default function MarkdownEmail(props: {
  markdown?: string;
  preview?: string;
  disabledSignature?: boolean;
}) {
  // Create a local copy to avoid mutating frozen props
  let markdown =
    props.markdown ?? "# Hello\n\nThis is a sample markdown email.";

  if (!props.disabledSignature) {
    markdown += `

Best,\n
${SiteConfig.team.name} from ${SiteConfig.title}
    `;
  }

  // Normalize markdown by removing leading/trailing spaces from each line
  markdown = markdown
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return (
    <EmailLayout disableTailwind>
      <Preview>{props.preview ?? "You receive a markdown email."}</Preview>
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
            color: "#10b981",
          },
        }}
      >
        {markdown}
      </Markdown>
    </EmailLayout>
  );
}
