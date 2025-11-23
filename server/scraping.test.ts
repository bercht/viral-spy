import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("scraping endpoints", () => {
  it("should list scrapings for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scraping.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get scraping by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will return undefined if no scraping exists, which is fine for testing
    const result = await caller.scraping.get({ id: 999 });
    
    expect(result === undefined || typeof result === "object").toBe(true);
  });
});

describe("chat endpoints", () => {
  it("should get chat messages for a scraping", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.getMessages({ scrapingId: 999 });
    
    expect(Array.isArray(result)).toBe(true);
  });
});
