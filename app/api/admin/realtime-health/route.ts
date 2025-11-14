import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { logger } from "@/lib/logger";
import { getRealtimeHealthStats } from "@/lib/monitoring/realtime-health";

export async function GET() {
  try {
    const user = await getRequiredUser();
    const isAdmin =
      user.role === "ADMIN" || user.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const stats = await getRealtimeHealthStats();

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    logger.error("Failed to fetch realtime health", { error });
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
