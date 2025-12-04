import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { browserPool, parallelScrape } from "./browserPool";
import { BrowserContext } from "playwright";

describe("Browser Pool", () => {
  beforeAll(async () => {
    await browserPool.initialize();
  });

  afterAll(async () => {
    await browserPool.close();
  });

  it("should initialize browser pool", async () => {
    const status = browserPool.getStatus();
    expect(status.isInitialized).toBe(true);
    expect(status.maxContexts).toBe(3);
    expect(status.availableContexts).toBe(3);
  });

  it("should acquire and release context", async () => {
    const context = await browserPool.acquireContext();
    expect(context).toBeDefined();

    const statusAfterAcquire = browserPool.getStatus();
    expect(statusAfterAcquire.availableContexts).toBe(2);

    browserPool.releaseContext(context);

    const statusAfterRelease = browserPool.getStatus();
    expect(statusAfterRelease.availableContexts).toBe(3);
  });

  it("should handle multiple concurrent context acquisitions", async () => {
    const contexts = await Promise.all([
      browserPool.acquireContext(),
      browserPool.acquireContext(),
      browserPool.acquireContext(),
    ]);

    expect(contexts).toHaveLength(3);
    const status = browserPool.getStatus();
    expect(status.availableContexts).toBe(0);

    contexts.forEach((ctx) => browserPool.releaseContext(ctx));

    const statusAfterRelease = browserPool.getStatus();
    expect(statusAfterRelease.availableContexts).toBe(3);
  });
});

describe("Parallel Scraping", () => {
  afterAll(async () => {
    await browserPool.close();
  });

  it("should process tasks in parallel", async () => {
    const tasks = [
      { id: 1, url: "https://example.com" },
      { id: 2, url: "https://example.com" },
      { id: 3, url: "https://example.com" },
    ];

    const scrapeFunction = async (
      task: { id: number; url: string },
      context: BrowserContext
    ) => {
      const page = await context.newPage();
      await page.goto(task.url, { timeout: 10000 });
      const title = await page.title();
      await page.close();
      return { id: task.id, title };
    };

    const startTime = Date.now();
    const results = await parallelScrape(tasks, scrapeFunction, 3);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(3);
    expect(results[0]).toHaveProperty("id");
    expect(results[0]).toHaveProperty("title");

    // 병렬 처리로 인해 순차 처리보다 빨라야 함
    console.log(`Parallel scraping completed in ${duration}ms`);
    expect(duration).toBeLessThan(10000); // 10초 이내
  });

  it("should process large batches efficiently", async () => {
    const tasks = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      url: "https://example.com",
    }));

    const scrapeFunction = async (
      task: { id: number; url: string },
      context: BrowserContext
    ) => {
      const page = await context.newPage();
      await page.goto(task.url, { timeout: 10000 });
      const title = await page.title();
      await page.close();
      return { id: task.id, title };
    };

    const startTime = Date.now();
    const results = await parallelScrape(tasks, scrapeFunction, 3);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(9);
    console.log(`9 tasks completed in ${duration}ms with 3 concurrent contexts`);
  });
});
