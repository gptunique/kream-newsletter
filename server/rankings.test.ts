import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { scrapeMockData, saveScrapedData } from "./scraper";

function createTestContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("KREAM Newsletter API Tests", () => {
  beforeAll(async () => {
    // 테스트 데이터 준비
    const mockData = await scrapeMockData();
    await saveScrapedData(mockData);
  }, 30000); // 30초 타임아웃

  it("should fetch latest rankings", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const rankings = await caller.rankings.latest();

    expect(rankings).toBeDefined();
    expect(Array.isArray(rankings)).toBe(true);
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings.length).toBeLessThanOrEqual(30);

    // 첫 번째 랭킹 항목 검증
    const firstRanking = rankings[0];
    expect(firstRanking).toHaveProperty("rank");
    expect(firstRanking).toHaveProperty("price");
    expect(firstRanking).toHaveProperty("brand");
    expect(firstRanking).toHaveProperty("nameKo");
    expect(firstRanking.rank).toBe(1);
  });

  it("should fetch product by id", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 먼저 랭킹을 가져와서 첫 번째 제품 ID를 얻음
    const rankings = await caller.rankings.latest();
    const firstProductId = rankings[0]?.productId;

    if (firstProductId) {
      const product = await caller.products.byId({ id: firstProductId });

      expect(product).toBeDefined();
      expect(product?.id).toBe(firstProductId);
      expect(product).toHaveProperty("brand");
      expect(product).toHaveProperty("nameKo");
    }
  });

  it("should trigger mock scraping", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scraper.trigger({ mode: "mock" });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect(result.recordedAt).toBeInstanceOf(Date);
  }, 30000); // 30초 타임아웃

  it("should fetch rankings by date", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const today = new Date().toISOString().split("T")[0];
    const rankings = await caller.rankings.byDate({ date: today });

    expect(rankings).toBeDefined();
    expect(Array.isArray(rankings)).toBe(true);
  });
});
