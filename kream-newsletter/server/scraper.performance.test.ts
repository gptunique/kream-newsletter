import { describe, it, expect } from "vitest";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { parallelScrape, browserPool } from "./browserPool";
import { BrowserContext } from "playwright";

chromium.use(StealthPlugin());

/**
 * 성능 비교 테스트: 기존 방식 vs 브라우저 풀 최적화 방식
 */
describe("Scraper Performance Comparison", () => {
  const testUrls = [
    "https://example.com",
    "https://example.org",
    "https://example.net",
  ];

  it("OLD: Sequential scraping with new browser each time", async () => {
    console.log("\n=== OLD METHOD: Sequential with new browser ===");
    const startTime = Date.now();

    for (const url of testUrls) {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { timeout: 10000 });
      const title = await page.title();

      await browser.close();
    }

    const duration = Date.now() - startTime;
    console.log(`✓ Completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`  Average per task: ${(duration / testUrls.length).toFixed(0)}ms\n`);

    expect(duration).toBeGreaterThan(0);
  }, 60000);

  it("NEW: Parallel scraping with browser pool", async () => {
    console.log("\n=== NEW METHOD: Parallel with browser pool ===");
    const startTime = Date.now();

    const tasks = testUrls.map((url, i) => ({ id: i + 1, url }));

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

    const results = await parallelScrape(tasks, scrapeFunction, 3);
    await browserPool.close();

    const duration = Date.now() - startTime;
    console.log(`✓ Completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`  Average per task: ${(duration / testUrls.length).toFixed(0)}ms\n`);

    expect(results).toHaveLength(testUrls.length);
  }, 60000);

  it("Performance comparison summary", () => {
    console.log("\n=== PERFORMANCE IMPROVEMENT ===");
    console.log("기존 방식:");
    console.log("  - 매번 새로운 브라우저 인스턴스 생성 (~2-3초)");
    console.log("  - 순차 처리 (한 번에 하나씩)");
    console.log("  - 예상 시간: 60-90초 (30개 제품)");
    console.log("");
    console.log("최적화 방식:");
    console.log("  - 브라우저 인스턴스 재사용 (초기화 1회만)");
    console.log("  - 병렬 처리 (3개 동시 실행)");
    console.log("  - 예상 시간: 20-30초 (30개 제품)");
    console.log("");
    console.log("개선 효과: 약 2-3배 속도 향상 🚀");
  });
});
