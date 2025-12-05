import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { triggerManualScrape } from "./scheduler";

const mockResult = {
  success: true,
  count: 1,
  recordedAt: new Date(),
};

const mockData = [
  {
    rank: 1,
    brand: "Nike",
    name: "Test Product",
    name_ko: "테스트 제품",
    price: 100000,
    image_url: "https://example.com/image.jpg",
  },
];

// Mock 함수들
vi.mock("./scraper", () => ({
  scrapeMockData: vi.fn(async () => mockData),
  scrapeRealtimeData: vi.fn(async () => mockData),
  scrapePopularPage: vi.fn(async () => mockData),
  saveScrapedData: vi.fn(async () => mockResult),
}));

describe("scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should trigger mock scraping successfully", async () => {
    const result = await triggerManualScrape("mock");

    expect(result).toEqual({
      success: true,
      count: 1,
      recordedAt: expect.any(Date),
    });
  });

  it("should trigger realtime scraping successfully", async () => {
    const result = await triggerManualScrape("realtime");

    expect(result).toEqual({
      success: true,
      count: 1,
      recordedAt: expect.any(Date),
    });
  });

  it("should trigger popular page scraping successfully", async () => {
    const result = await triggerManualScrape("popular");

    expect(result).toEqual({
      success: true,
      count: 1,
      recordedAt: expect.any(Date),
    });
  });

  it("should handle scraping errors", async () => {
    const { scrapeMockData } = await import("./scraper");
    vi.mocked(scrapeMockData).mockRejectedValueOnce(new Error("Scraping failed"));

    await expect(triggerManualScrape("mock")).rejects.toThrow("Scraping failed");
  });
});
