import { NextResponse } from "next/server";

/**
 * Kept as an explicit tombstone for old clients and bookmarked checkout tabs.
 * No blockchain lookup or subscription mutation is performed.
 */
export async function POST() {
  return NextResponse.json(
    {
      confirmed: false,
      error:
        "Crypto payments are not supported. MyCryptoPilot is a read-only demo.",
      code: "PAYMENTS_DISABLED",
    },
    { status: 410 },
  );
}
