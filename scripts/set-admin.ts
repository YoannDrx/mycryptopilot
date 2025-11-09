#!/usr/bin/env tsx

/**
 * Script pour passer un utilisateur en admin
 * Usage: pnpm tsx scripts/set-admin.ts <email>
 */

import { prisma } from "../src/lib/prisma";

const email = process.argv[2];

if (!email) {
  console.error("❌ Usage: pnpm tsx scripts/set-admin.ts <email>");
  process.exit(1);
}

async function setAdmin() {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current role: ${user.role ?? "user"}`);

    if (user.role === "admin") {
      console.log(`\n✅ User is already an admin!`);
      process.exit(0);
    }

    // Set admin role
    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`\n✅ Successfully set ${email} as admin!`);
    console.log(`   New role: admin`);
  } catch (error) {
    console.error(`\n❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void setAdmin();
