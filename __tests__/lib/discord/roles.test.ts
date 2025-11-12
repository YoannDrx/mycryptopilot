import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assignRoleToUser,
  removeAllRolesFromUser,
} from "@/lib/discord/roles";
import * as RolesModule from "@/lib/discord/roles";
import { DISCORD_CONFIG } from "@/lib/discord/config";

const hoisted = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  getClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: hoisted.logger,
}));

vi.mock("@/lib/discord/bot-client", () => ({
  discordBot: {
    getClient: hoisted.getClient,
  },
}));

const loggerMock = hoisted.logger;
const mockGetClient = hoisted.getClient;

const ensureRolesExistSpy = vi
  .spyOn(RolesModule, "ensureRolesExist")
  .mockResolvedValue();

const buildGuild = () => {
  const makeRole = (id: string, name: string) => ({
    id,
    name,
    setPosition: vi.fn().mockResolvedValue(undefined),
  });

  const freeRole = makeRole("role-free", DISCORD_CONFIG.roles.FREE);
  const proRole = makeRole("role-pro", DISCORD_CONFIG.roles.PRO);
  const ultraRole = makeRole("role-ultra", DISCORD_CONFIG.roles.ULTRA);

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
    mockGetClient.mockReset();
    loggerMock.error.mockReset();
    loggerMock.info.mockReset();
    loggerMock.warn.mockReset();
    ensureRolesExistSpy.mockClear();
    ensureRolesExistSpy.mockResolvedValue(undefined);
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
    expect(loggerMock.error).not.toHaveBeenCalled();
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
