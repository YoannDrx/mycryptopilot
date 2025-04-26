import { logger } from "@/lib/logger";
import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma";

// Set seed for reproducibility
faker.seed(123);

async function main() {
  logger.info("🌱 Seeding database...");

  // Create 10 users
  const userCreatePromises = Array.from({ length: 10 }, async () => {
    const email = faker.internet.email();
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email,
        emailVerified: faker.datatype.boolean(0.8), // 80% chance of being verified
        image: faker.image.avatar(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        stripeCustomerId: faker.string.alphanumeric(10),
      },
    });
  });

  const users = await Promise.all(userCreatePromises);
  users.forEach((user) => logger.info(`👤 Created user: ${user.name}`));

  // Create 3 organizations
  const memberPromises: Promise<unknown>[] = [];
  const invitationPromises: Promise<unknown>[] = [];

  // Prepare organization creation data
  const orgData = Array.from({ length: 3 }, () => {
    const orgName = faker.company.name();
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return { orgName, orgSlug };
  });

  // Create all organizations first
  const organizations = await Promise.all(
    orgData.map(async ({ orgName, orgSlug }) =>
      prisma.organization
        .upsert({
          where: { slug: orgSlug },
          update: {},
          create: {
            id: faker.string.uuid(),
            name: orgName,
            slug: orgSlug,
            logo: faker.image.url(),
            email: faker.internet.email(),
            createdAt: faker.date.past(),
          },
        })
        .then((org) => {
          logger.info(`🏢 Created organization: ${org.name}`);
          return org;
        }),
    ),
  );

  // Process members and invitations for each organization
  organizations.forEach((organization) => {
    const roleOptions = ["OWNER", "ADMIN", "MEMBER"];

    // Make sure each org has at least one owner
    memberPromises.push(
      prisma.member
        .create({
          data: {
            id: faker.string.uuid(),
            organizationId: organization.id,
            userId: users[0].id, // First user is always an owner
            role: "OWNER",
            createdAt: faker.date.past(),
          },
        })
        .then(() =>
          logger.info(
            `👑 Added ${users[0].name} as OWNER to ${organization.name}`,
          ),
        ),
    );

    // Add 2-4 more random members to each org
    const memberCount = faker.number.int({ min: 2, max: 4 });
    const memberIndices = faker.helpers.uniqueArray(
      () => faker.number.int({ min: 1, max: users.length - 1 }),
      memberCount,
    );

    for (const index of memberIndices) {
      const user = users[index];
      const role = faker.helpers.arrayElement(roleOptions);

      memberPromises.push(
        prisma.member
          .create({
            data: {
              id: faker.string.uuid(),
              organizationId: organization.id,
              userId: user.id,
              role,
              createdAt: faker.date.past(),
            },
          })
          .then(() =>
            logger.info(
              `👥 Added ${user.name} as ${role} to ${organization.name}`,
            ),
          ),
      );
    }

    // Create 1-3 invitations for each organization
    const invitationCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < invitationCount; j++) {
      const invitationEmail = faker.internet.email();
      invitationPromises.push(
        prisma.invitation
          .create({
            data: {
              id: faker.string.uuid(),
              organizationId: organization.id,
              email: invitationEmail,
              role: faker.helpers.arrayElement(roleOptions),
              status: faker.helpers.arrayElement([
                "PENDING",
                "ACCEPTED",
                "EXPIRED",
              ]),
              expiresAt: faker.date.future(),
              inviterId: users[0].id, // First user is always the inviter
            },
          })
          .then(() =>
            logger.info(
              `📨 Created invitation to ${invitationEmail} for ${organization.name}`,
            ),
          ),
      );
    }
  });

  await Promise.all([...memberPromises, ...invitationPromises]);

  // Create feedback entries
  const feedbackPromises = Array.from({ length: 15 }, async () => {
    const randomUser = faker.helpers.arrayElement(users);

    return prisma.feedback
      .create({
        data: {
          id: faker.string.nanoid(11),
          review: faker.number.int({ min: 1, max: 5 }),
          message: faker.lorem.paragraph(),
          email: randomUser.email,
          userId: faker.datatype.boolean(0.7) ? randomUser.id : null, // 70% chance of having a user ID
        },
      })
      .then((feedback) =>
        logger.info(
          `📝 Created feedback from ${feedback.email ?? "anonymous"}`,
        ),
      );
  });

  await Promise.all(feedbackPromises);
  logger.info("✅ Seeding completed!");
}

main()
  .catch((e) => {
    logger.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
