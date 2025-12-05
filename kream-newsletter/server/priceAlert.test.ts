import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkPriceChangeAndNotify } from "./priceAlert";

// Mock 데이터베이스 및 알림 함수
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => [
              { productId: 1, price: 100000, recordedAt: new Date() },
              { productId: 1, price: 90000, recordedAt: new Date(Date.now() - 86400000) }, // 1일 전
            ]),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("../drizzle/schema", () => ({
  rankings: {
    productId: "productId",
    price: "price",
    recordedAt: "recordedAt",
  },
}));

describe("priceAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send notification when price changes by more than 10%", async () => {
    const { notifyOwner } = await import("./_core/notification");
    
    // 90,000원 → 100,000원 (11.11% 상승)
    const result = await checkPriceChangeAndNotify(1, 100000, "테스트 제품");

    expect(result).toBe(true);
    expect(notifyOwner).toHaveBeenCalledWith({
      title: expect.stringContaining("가격 상승 알림"),
      content: expect.stringContaining("테스트 제품"),
    });
  });

  it("should not send notification when price changes by less than 10%", async () => {
    const { getDb } = await import("./db");
    const { notifyOwner } = await import("./_core/notification");

    // Mock: 95,000원 → 100,000원 (5.26% 상승)
    vi.mocked(getDb).mockResolvedValueOnce({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [
                { productId: 1, price: 100000, recordedAt: new Date() },
                { productId: 1, price: 95000, recordedAt: new Date(Date.now() - 86400000) },
              ]),
            })),
          })),
        })),
      })),
    } as any);

    const result = await checkPriceChangeAndNotify(1, 100000, "테스트 제품");

    expect(result).toBe(false);
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("should handle price decrease correctly", async () => {
    const { getDb } = await import("./db");
    const { notifyOwner } = await import("./_core/notification");

    // Mock: 100,000원 → 80,000원 (20% 하락)
    vi.mocked(getDb).mockResolvedValueOnce({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [
                { productId: 1, price: 80000, recordedAt: new Date() },
                { productId: 1, price: 100000, recordedAt: new Date(Date.now() - 86400000) },
              ]),
            })),
          })),
        })),
      })),
    } as any);

    const result = await checkPriceChangeAndNotify(1, 80000, "테스트 제품");

    expect(result).toBe(true);
    expect(notifyOwner).toHaveBeenCalledWith({
      title: expect.stringContaining("가격 하락 알림"),
      content: expect.stringContaining("20.00% 하락"),
    });
  });

  it("should return false when no previous data exists", async () => {
    const { getDb } = await import("./db");
    const { notifyOwner } = await import("./_core/notification");

    // Mock: 이전 데이터 없음
    vi.mocked(getDb).mockResolvedValueOnce({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [
                { productId: 1, price: 100000, recordedAt: new Date() },
              ]),
            })),
          })),
        })),
      })),
    } as any);

    const result = await checkPriceChangeAndNotify(1, 100000, "테스트 제품");

    expect(result).toBe(false);
    expect(notifyOwner).not.toHaveBeenCalled();
  });
});
