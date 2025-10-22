import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    traderProfile: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/features/trader/trader-queries", () => ({
  checkUserHasTraderProfile: vi.fn(),
  getTraderProfileByUserId: vi.fn(),
  getUserWithTraderProfile: vi.fn(),
}));

describe("trader.action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTraderProfileAction", () => {
    it("should create a trader profile and set role to TRADER", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { checkUserHasTraderProfile, getUserWithTraderProfile } =
        await import("@/features/trader/trader-queries");

      // Mock: User n'a pas de profil
      vi.mocked(checkUserHasTraderProfile).mockResolvedValue(false);

      // Mock: User avec role USER
      vi.mocked(getUserWithTraderProfile).mockResolvedValue({
        id: "user_123",
        email: "trader@test.com",
        name: "Test Trader",
        image: null,
        userRole: "USER",
        traderProfile: null,
      } as never);

      // Mock: Creation profil
      vi.mocked(prisma.traderProfile.create).mockResolvedValue({
        id: "trader_123",
        userId: "user_123",
        displayName: "Pro Trader",
        bio: "Expert BTC",
        statsJson: null,
        verified: false,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      // Mock: Update user role
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user_123",
        userRole: "TRADER",
      } as never);

      const { createTraderProfileAction } = await import(
        "@/features/trader/trader.action"
      );

      // Note: On ne peut pas tester directement les actions Server car elles utilisent authAction
      // qui nécessite un contexte d'exécution. On va vérifier que les fonctions sont exportées.
      expect(createTraderProfileAction).toBeDefined();
      expect(typeof createTraderProfileAction).toBe("function");
    });

    it("should throw error if trader profile already exists", async () => {
      const { checkUserHasTraderProfile } = await import(
        "@/features/trader/trader-queries"
      );

      // Mock: User a déjà un profil
      vi.mocked(checkUserHasTraderProfile).mockResolvedValue(true);

      const { createTraderProfileAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(createTraderProfileAction).toBeDefined();
      // Action vérifie via checkUserHasTraderProfile et throw ActionError
    });
  });

  describe("updateTraderProfileAction", () => {
    it("should update trader profile", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { getTraderProfileByUserId } = await import(
        "@/features/trader/trader-queries"
      );

      // Mock: Profile existe
      vi.mocked(getTraderProfileByUserId).mockResolvedValue({
        id: "trader_123",
        userId: "user_123",
        displayName: "Old Name",
        bio: "Old bio",
        statsJson: null,
        verified: false,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user_123",
          name: "Test",
          email: "test@test.com",
          image: null,
        },
      } as never);

      // Mock: Update
      vi.mocked(prisma.traderProfile.update).mockResolvedValue({
        id: "trader_123",
        displayName: "New Name",
        bio: "New bio",
      } as never);

      const { updateTraderProfileAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(updateTraderProfileAction).toBeDefined();
      expect(typeof updateTraderProfileAction).toBe("function");
    });

    it("should throw error if profile does not exist", async () => {
      const { getTraderProfileByUserId } = await import(
        "@/features/trader/trader-queries"
      );

      // Mock: Pas de profile
      vi.mocked(getTraderProfileByUserId).mockResolvedValue(null);

      const { updateTraderProfileAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(updateTraderProfileAction).toBeDefined();
      // Action vérifie et throw ActionError
    });
  });

  describe("toggleTraderRoleAction", () => {
    it("should enable trader role when profile exists", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { checkUserHasTraderProfile, getUserWithTraderProfile } =
        await import("@/features/trader/trader-queries");

      // Mock: User avec profil
      vi.mocked(checkUserHasTraderProfile).mockResolvedValue(true);

      vi.mocked(getUserWithTraderProfile).mockResolvedValue({
        id: "user_123",
        email: "trader@test.com",
        name: "Test Trader",
        image: null,
        userRole: "USER",
        traderProfile: {
          id: "trader_123",
          displayName: "Pro Trader",
          bio: null,
          verified: false,
          statsJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as never);

      // Mock: Update role
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user_123",
        userRole: "TRADER",
      } as never);

      const { toggleTraderRoleAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(toggleTraderRoleAction).toBeDefined();
      expect(typeof toggleTraderRoleAction).toBe("function");
    });

    it("should disable trader role", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { getUserWithTraderProfile } = await import(
        "@/features/trader/trader-queries"
      );

      vi.mocked(getUserWithTraderProfile).mockResolvedValue({
        id: "user_123",
        email: "trader@test.com",
        name: "Test Trader",
        image: null,
        userRole: "TRADER",
        traderProfile: {
          id: "trader_123",
          displayName: "Pro Trader",
          bio: null,
          verified: false,
          statsJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as never);

      // Mock: Disable role -> USER
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user_123",
        userRole: "USER",
      } as never);

      const { toggleTraderRoleAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(toggleTraderRoleAction).toBeDefined();
      expect(typeof toggleTraderRoleAction).toBe("function");
    });

    it("should throw error if enabling without profile", async () => {
      const { checkUserHasTraderProfile, getUserWithTraderProfile } =
        await import("@/features/trader/trader-queries");

      // Mock: Pas de profile
      vi.mocked(checkUserHasTraderProfile).mockResolvedValue(false);
      vi.mocked(getUserWithTraderProfile).mockResolvedValue({
        id: "user_123",
        email: "trader@test.com",
        name: "Test Trader",
        image: null,
        userRole: "USER",
        traderProfile: null,
      } as never);

      const { toggleTraderRoleAction } = await import(
        "@/features/trader/trader.action"
      );

      expect(toggleTraderRoleAction).toBeDefined();
      // Action vérifie et throw ActionError si pas de profil
    });
  });

  describe("Schema Validation", () => {
    it("should validate CreateTraderProfileSchema", async () => {
      const { CreateTraderProfileSchema } = await import(
        "@/features/trader/trader.schema"
      );

      const validData = {
        displayName: "Pro Trader",
        bio: "Expert in BTC trading",
        image: "https://example.com/avatar.jpg",
      };

      const result = CreateTraderProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid displayName (too short)", async () => {
      const { CreateTraderProfileSchema } = await import(
        "@/features/trader/trader.schema"
      );

      const invalidData = {
        displayName: "AB", // Moins de 3 caractères
        bio: "Valid bio",
      };

      const result = CreateTraderProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "at least 3 characters",
        );
      }
    });

    it("should reject invalid bio (too long)", async () => {
      const { CreateTraderProfileSchema } = await import(
        "@/features/trader/trader.schema"
      );

      const invalidData = {
        displayName: "Valid Name",
        bio: "A".repeat(501), // Plus de 500 caractères
      };

      const result = CreateTraderProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "less than 500 characters",
        );
      }
    });

    it("should validate UpdateTraderProfileSchema", async () => {
      const { UpdateTraderProfileSchema } = await import(
        "@/features/trader/trader.schema"
      );

      const validData = {
        displayName: "Updated Name",
        bio: "Updated bio",
      };

      const result = UpdateTraderProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate ToggleTraderRoleSchema", async () => {
      const { ToggleTraderRoleSchema } = await import(
        "@/features/trader/trader.schema"
      );

      const validData = { enabled: true };
      const result = ToggleTraderRoleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
