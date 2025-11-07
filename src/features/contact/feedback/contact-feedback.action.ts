"use server";

import { action } from "@/lib/actions/safe-actions";
import { getUser } from "@/lib/auth/auth-user";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import MarkdownEmail from "@email/markdown.email";
import { ContactFeedbackSchema } from "./contact-feedback.schema";

export const feedbackAction = action
  .inputSchema(ContactFeedbackSchema)
  .action(async ({ parsedInput: data }) => {
    const user = await getUser();

    const email = user?.email ?? data.email;

    const feedback = await prisma.feedback.create({
      data: {
        message: data.message,
        review: Number(data.review) || 0,
        userId: user?.id,
        email,
      },
    });

    // Create formatted email with MarkdownEmail template
    const reviewEmojis = ["😠", "😕", "😐", "😊"];
    const reviewLabels = [
      "Extremely Dissatisfied",
      "Somewhat Dissatisfied",
      "Neutral",
      "Satisfied",
    ];
    const reviewIndex = feedback.review - 1;
    const reviewEmoji = reviewEmojis[reviewIndex] ?? "❓";
    const reviewLabel = reviewLabels[reviewIndex] ?? "Unknown";

    const markdown = `
# New Feedback Received ${reviewEmoji}

A user has submitted feedback on [${SiteConfig.title}](${SiteConfig.prodUrl}).

## User Information

- **Email:** ${email}
- **User ID:** ${user?.id ?? "Anonymous"}

## Feedback Details

**Rating:** ${reviewEmoji} ${reviewLabel} (${feedback.review}/4)

**Message:**

${feedback.message}

---

*You can reply directly to this email to respond to the user.*
`;

    await sendEmail({
      to: env.NEXT_PUBLIC_EMAIL_CONTACT,
      subject: `New feedback from ${email}`,
      html: MarkdownEmail({ markdown }),
      replyTo: email,
    });

    return { message: "Your feedback has been sent to support." };
  });
