-- This is an empty migration.

-- CreateOrganizationPlans
INSERT INTO "OrganizationPlan" ("id", "name", "maximumMembers", "createdAt", "updatedAt")
VALUES 
  ('FREE', 'Free Plan', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PRO', 'Pro Plan', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;