import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: "Referral automation is retired.", code: "JOB_RETIRED" },
    { status: 410 },
  );
}
