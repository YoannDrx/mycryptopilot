import { NextResponse } from "next/server";

/**
 * API route to get database connection information
 * Only available in development mode
 */
export async function GET() {
  // Only available in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  const dbUrl = process.env.DATABASE_URL ?? "";

  // Parse the database URL to extract info
  let dbInfo = {
    type: "unknown",
    host: "unknown",
    database: "unknown",
    icon: "❓",
  };

  if (dbUrl.includes("neon.tech")) {
    // Neon Cloud database
    const hostMatch = dbUrl.match(/@([\w-]+)\.[\w-]+\.aws\.neon\.tech/);
    const dbMatch = dbUrl.match(/neon\.tech\/([\w-]+)/);

    dbInfo = {
      type: "Neon Cloud",
      host: hostMatch?.[1] ?? "neon",
      database: dbMatch?.[1] ?? "neondb",
      icon: "☁️",
    };
  } else if (dbUrl.includes("localhost")) {
    // Local PostgreSQL database
    const portMatch = dbUrl.match(/localhost:(\d+)/);
    const dbMatch = dbUrl.match(/localhost:\d+\/([\w-]+)/);

    dbInfo = {
      type: "PostgreSQL Local",
      host: `localhost:${portMatch?.[1] ?? "5432"}`,
      database: dbMatch?.[1] ?? "unknown",
      icon: "💻",
    };
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    database: dbInfo,
  });
}
