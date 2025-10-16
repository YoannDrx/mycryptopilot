import { PrismaClient } from "@/generated/prisma";

async function globalTeardown() {
  // Créer une instance Prisma dédiée pour les tests avec la DATABASE_URL de test
  // (évite d'utiliser @/lib/prisma qui peut pointer vers une autre DB)
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    const count = await prisma.user.deleteMany({
      where: {
        email: {
          contains: "playwright-test-",
        },
      },
    });

    // eslint-disable-next-line no-console
    console.info(
      `✅ Cleanup: ${count.count} test users deleted from test database`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Teardown cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
