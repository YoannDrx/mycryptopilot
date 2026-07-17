import { NextResponse } from "next/server";

/**
 * Crypto checkout was part of an earlier commercial experiment.
 * It is deliberately unavailable in the public read-only demonstrator.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Crypto payments are not supported. MyCryptoPilot is a read-only demo.",
      code: "PAYMENTS_DISABLED",
    },
    { status: 410 },
  );
}
