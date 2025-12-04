import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, BrowserContext } from "playwright";

// Stealth 플러그인 적용
chromium.use(StealthPlugin());

/**
 * 브라우저 풀 관리 클래스
 * - 브라우저 인스턴스 재사용으로 시작 시간 단축
 * - 여러 컨텍스트를 통한 병렬 처리 지원
 */
class BrowserPool {
  private browser: Browser | null = null;
  private contexts: BrowserContext[] = [];
  private maxContexts: number;
  private isInitialized: boolean = false;

  constructor(maxContexts: number = 3) {
    this.maxContexts = maxContexts;
  }

  /**
   * 브라우저 풀 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("[BrowserPool] Already initialized");
      return;
    }

    console.log("[BrowserPool] Initializing browser...");
    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
      ],
    });

    // 여러 컨텍스트 미리 생성 (병렬 처리용)
    for (let i = 0; i < this.maxContexts; i++) {
      const context = await this.createContext();
      this.contexts.push(context);
    }

    this.isInitialized = true;
    console.log(`[BrowserPool] Initialized with ${this.maxContexts} contexts`);
  }

  /**
   * 새로운 브라우저 컨텍스트 생성
   */
  private async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      extraHTTPHeaders: {
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://kream.co.kr",
      },
    });

    // navigator.webdriver 제거 (봇 감지 우회)
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    return context;
  }

  /**
   * 사용 가능한 컨텍스트 획득
   */
  async acquireContext(): Promise<BrowserContext> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 사용 가능한 컨텍스트 반환 (라운드 로빈)
    const context = this.contexts.shift();
    if (!context) {
      throw new Error("No available context");
    }

    return context;
  }

  /**
   * 컨텍스트 반환 (재사용 풀에 추가)
   */
  releaseContext(context: BrowserContext): void {
    this.contexts.push(context);
  }

  /**
   * 브라우저 풀 종료
   */
  async close(): Promise<void> {
    console.log("[BrowserPool] Closing browser pool...");

    // 모든 컨텍스트 닫기
    for (const context of this.contexts) {
      await context.close();
    }
    this.contexts = [];

    // 브라우저 닫기
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.isInitialized = false;
    console.log("[BrowserPool] Closed");
  }

  /**
   * 브라우저 풀 상태 확인
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      availableContexts: this.contexts.length,
      maxContexts: this.maxContexts,
    };
  }
}

// 싱글톤 인스턴스
export const browserPool = new BrowserPool(3);

/**
 * 병렬 스크래핑 헬퍼 함수
 * @param tasks 스크래핑 작업 배열
 * @param concurrency 동시 실행 수
 */
export async function parallelScrape<T, R>(
  tasks: T[],
  scrapeFunction: (task: T, context: BrowserContext) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  await browserPool.initialize();

  const results: R[] = [];
  const chunks: T[][] = [];

  // 작업을 청크로 분할
  for (let i = 0; i < tasks.length; i += concurrency) {
    chunks.push(tasks.slice(i, i + concurrency));
  }

  console.log(`[ParallelScrape] Processing ${tasks.length} tasks in ${chunks.length} chunks`);

  // 각 청크를 병렬 처리
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex]!;
    console.log(`[ParallelScrape] Chunk ${chunkIndex + 1}/${chunks.length}`);

    const chunkResults = await Promise.all(
      chunk.map(async (task: T) => {
        const context = await browserPool.acquireContext();
        try {
          const result = await scrapeFunction(task, context);
          return result;
        } catch (error) {
          console.error(`[ParallelScrape] Error processing task:`, error);
          throw error;
        } finally {
          browserPool.releaseContext(context);
        }
      })
    );

    results.push(...chunkResults);
  }

  console.log(`[ParallelScrape] Completed ${results.length} tasks`);
  return results;
}
