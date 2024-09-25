import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ReactNode } from "react";
import { resend } from "./resend";

type ResendSendType = typeof resend.emails.send;
type ResendParamsType = Parameters<ResendSendType>;
type ResendParamsTypeWithConditionalFrom = [
  payload: Omit<ResendParamsType[0], "from"> & { from?: string },
  options?: ResendParamsType[1],
];

/**
 * sendEmail will send an email using resend.
 * To avoid repeating the same "from" email, you can leave it empty and it will use the default one.
 * Also, in development, it will add "[DEV]" to the subject.
 * @param params[0] : payload
 * @param params[1] : options
 * @returns a promise of the email sent
 */
export const sendEmail = async (
  ...params: ResendParamsTypeWithConditionalFrom
) => {
  if (env.NODE_ENV === "development") {
    params[0].subject = `[DEV] ${params[0].subject}`;
  }
  const resendParams = [
    {
      ...params[0],
      from: params[0].from ?? env.RESEND_EMAIL_FROM,
      text:
        (params[0].text ?? params[0].react)
          ? extractTextFromReactNode(params[0].react)
          : "Please check your email to see the content.",
    } as ResendParamsType[0],
    params[1],
  ] satisfies ResendParamsType;

  const result = await resend.emails.send(...resendParams);

  if (result.error) {
    logger.error("[sendEmail] Error", { result, subject: params[0].subject });
  }

  return result;
};

function extractTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return node.toString();
  }

  if (Array.isArray(node)) {
    const nodes = node as ReactNode[];
    return nodes.map(extractTextFromReactNode).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const { children } = node.props;
    return extractTextFromReactNode(children);
  }

  return "";
}
