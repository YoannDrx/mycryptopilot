import { describe, expect, it } from "vitest";

import { POST as checkPayment } from "@app/api/crypto/check-payment/route";
import { POST as generateAddress } from "@app/api/crypto/generate-address/route";
import { GET as activeInvitees } from "@app/api/cron/active-invitees/route";
import { GET as expirationReminders } from "@app/api/cron/expiration-reminders/route";
import { GET as tierCheck } from "@app/api/cron/tier-check/route";

describe("retired crypto payment endpoints", () => {
  it.each([
    ["address generation", generateAddress],
    ["payment polling", checkPayment],
  ])("returns a permanent disabled response for %s", async (_label, post) => {
    const response = await post();
    const body = (await response.json()) as {
      code: string;
      error: string;
    };

    expect(response.status).toBe(410);
    expect(body.code).toBe("PAYMENTS_DISABLED");
    expect(body.error).toContain("read-only demo");
  });
});

describe("retired commercial jobs", () => {
  it.each([
    ["referrals", activeInvitees],
    ["expiration reminders", expirationReminders],
    ["tier checks", tierCheck],
  ])("cannot run %s", async (_label, get) => {
    const response = get();
    const body = (await response.json()) as { code: string };

    expect(response.status).toBe(410);
    expect(body.code).toBe("JOB_RETIRED");
  });
});
