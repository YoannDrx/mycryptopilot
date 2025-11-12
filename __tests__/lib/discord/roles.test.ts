import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assignRoleToUser,
  removeAllRolesFromUser,
} from "@/lib/discord/roles";
import * as RolesModule from "@/lib/discord/roles";
import { DISCORD_CONFIG } from "@/lib/discord/config";

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
  logger: loggerMock,
}));

const mockGetClient = vi.fn();
vi.mock("@/lib/discord/bot-client", () => ({
  discordBot: {
    getClient: mockGetClient,
  },
}));

const ensureRolesExistSpy = vi
  .spyOn(RolesModule, "ensureRolesExist")
  .mockResolvedValue();

const buildGuild = () => {
  const freeRole = { id: "role-free", name: DISCORD_CONFIG.roles.FREE };
  const proRole = { id: "role-pro", name: DISCORD_CONFIG.roles.PRO };
  const ultraRole = { id: "role-ultra", name: DISCORD_CONFIG.roles.ULTRA };

  const roles = [freeRole, proRole, ultraRole];
  const roleCache = {
    find: (predicate: (role: typeof roles[number]) => boolean) =>
      roles.find(predicate),
  };

  const memberRolesCache = new Map([[freeRole.id, freeRole]]);

  const member = {
    user: { tag: "Tester#1234" },
    roles: {
      cache: memberRolesCache,
      remove: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue(undefined),
    },
  };

  const guild = {
    roles: { cache: roleCache },
    members: {
      fetch: vi.fn().mockResolvedValue(member),
    },
  };

  return { guild, member, freeRole, proRole };
};

describe("Discord roles helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureRolesExistSpy.mockClear();
  });

  it("returns false when bot client is not initialized", async () => {
    mockGetClient.mockReturnValue(null);

    const result = await assignRoleToUser("123", "pro");

    expect(result).toBe(false);
    expect(ensureRolesExistSpy).not.toHaveBeenCalled();
  });

  it("assigns the correct plan role and removes old roles", async () => {
    const { guild, member, freeRole, proRole } = buildGuild();
    mockGetClient.mockReturnValue({
      guilds: { cache: { first: () => guild } },
    });

    const success = await assignRoleToUser("discord-1", "pro");

    expect(success).toBe(true);
    expect(guild.members.fetch).toHaveBeenCalledWith("discord-1");
    expect(member.roles.remove).toHaveBeenCalledWith(freeRole);
    expect(member.roles.add).toHaveBeenCalledWith(proRole);
  });

  it("removeAllRolesFromUser exits gracefully when no guild is available", async () => {
    mockGetClient.mockReturnValue({
      guilds: { cache: { first: () => null } },
    });

    const success = await removeAllRolesFromUser("discord-1");

    expect(success).toBe(false);
  });
});
