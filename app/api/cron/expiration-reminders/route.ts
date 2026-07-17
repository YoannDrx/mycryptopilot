import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: "Paid-plan reminders are retired.", code: "JOB_RETIRED" },
    { status: 410 },
  );
}
