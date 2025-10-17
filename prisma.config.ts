import dotenv from "dotenv";
import path from "node:path";
import type { PrismaConfig } from "prisma";

// Load .env files based on NODE_ENV (mimicking Next.js behavior)
// Priority order for test: .env.test.local > .env.test > .env
if (process.env.NODE_ENV === "test") {
  // CRITICAL: Use override:true to force test DATABASE_URL (ignore shell env vars)
  dotenv.config({
    path: path.join(process.cwd(), ".env.test.local"),
    override: true,
  });
  dotenv.config({
    path: path.join(process.cwd(), ".env.test"),
    override: true,
  });
  dotenv.config({ path: path.join(process.cwd(), ".env") });
} else {
  // Load development env files
  dotenv.config({ path: path.join(process.cwd(), ".env.local") });
  dotenv.config({ path: path.join(process.cwd(), ".env") });
}

export default {
  schema: path.join("prisma"),
} satisfies PrismaConfig;
