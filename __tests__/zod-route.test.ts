import { getUser } from "@/lib/auth/auth-user";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { authRoute, route } from "@/lib/zod-route";
import { describe, expect, it, vi } from "vitest";

/**
 * ZodRoute Tests
 * Big Bang (Issue #77 Phase 9) - Removed orgRoute tests
 */
describe("zod-route", () => {
  it("route should handle custom errors", async () => {
    const GET = route.handler(() => {
      throw new ZodRouteError("test");
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "test" });
  });

  it("route should handle custom errors with status", async () => {
    const GET = route.handler(() => {
      throw new ZodRouteError("test", 401);
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ message: "test" });
  });

  it("route should handle unknown errors with 500 without leaking details", async () => {
    const GET = route.handler(() => {
      throw new Error("test");
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ message: "Internal server error" });
  });

  it("authRoute should return 401 if user is not authenticated", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const GET = authRoute.handler(() => {
      return {
        message: "test",
      };
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ message: "Session not found!" });
  });

  const user = {
    id: "123",
    email: "test@test.com",
    name: "test",
    emailVerified: true,
    createdAt: new Date(1, 1, 1, 1),
    updatedAt: new Date(1, 1, 1, 1),
    banned: null,
    role: null,
    image: null,
    discordId: null,
    planName: null,
    planExpiresAt: null,
    userSubscription: null, // Added for user-centric architecture
  };

  it("authRoute should add the user inside the context if the user is authenticated", async () => {
    vi.mocked(getUser).mockResolvedValue(user);

    const GET = authRoute.handler((_request, { ctx }) => {
      return {
        message: "test",
        user: ctx.user,
      };
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      message: "test",
      user: JSON.parse(JSON.stringify(user)),
    });
  });
});
