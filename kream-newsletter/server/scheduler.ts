import cron from "node-cron";
import { scrapeMockData, scrapeRealtimeData, scrapePopularPage, saveScrapedData } from "./scraper";

/**
 * 스케줄러 초기화
 * 실시간 가격 스크래핑을 주기적으로 실행
 */
export function initScheduler() {
  // 매일 오전 9시에 실행 (한국 시간 기준)
  cron.schedule("0 9 * * *", async () => {
    await runScheduledScrape("daily-9am");
  }, {
    timezone: "Asia/Seoul"
  });

  // 매 6시간마다 실행 (오전 3시, 9시, 오후 3시, 9시)
  cron.schedule("0 3,9,15,21 * * *", async () => {
    await runScheduledScrape("every-6hours");
  }, {
    timezone: "Asia/Seoul"
  });

  // 사용자 알림 체크 (매 6시간마다)
  cron.schedule("0 3,9,15,21 * * *", async () => {
    await runUserAlertCheck();
  }, {
    timezone: "Asia/Seoul"
  });

  console.log("[Scheduler] Real-time price scraping scheduled:");
  console.log("  - Daily at 9:00 AM (Asia/Seoul)");
  console.log("  - Every 6 hours at 3:00, 9:00, 15:00, 21:00 (Asia/Seoul)");
  console.log("[Scheduler] User alert checking scheduled:");
  console.log("  - Every 6 hours at 3:00, 9:00, 15:00, 21:00 (Asia/Seoul)");
}

/**
 * 스케줄된 스크래핑 실행 (재시도 로직 포함)
 */
async function runScheduledScrape(scheduleType: string, retryCount = 0): Promise<void> {
  const maxRetries = 3;
  const retryDelay = 5 * 60 * 1000; // 5분

  console.log(`[Scheduler:${scheduleType}] Starting scraping at`, new Date().toISOString());
  
  try {
    // 실시간 가격 스크래핑 실행
    // 주의: Stealth 플러그인이 적용되어 있지만, 과도한 요청은 여전히 차단될 수 있음
    const data = await scrapeRealtimeData();
    const result = await saveScrapedData(data);
    
    console.log(`[Scheduler:${scheduleType}] Scraping completed successfully:`, {
      count: result.count,
      recordedAt: result.recordedAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Scheduler:${scheduleType}] Scraping failed (attempt ${retryCount + 1}/${maxRetries}):`, error);
    
    // 재시도 로직
    if (retryCount < maxRetries) {
      console.log(`[Scheduler:${scheduleType}] Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await runScheduledScrape(scheduleType, retryCount + 1);
    } else {
      console.error(`[Scheduler:${scheduleType}] Max retries reached. Giving up.`);
      // TODO: 실패 알림 전송 (예: 이메일, Slack 등)
    }
  }
}

/**
 * 수동 스크래핑 트리거
 */
export async function triggerManualScrape(mode: "mock" | "realtime" | "popular") {
  console.log(`[Manual Scrape] Starting ${mode} mode at`, new Date().toISOString());
  
  try {
    let data;
    if (mode === "mock") {
      data = await scrapeMockData();
    } else if (mode === "realtime") {
      data = await scrapeRealtimeData();
    } else {
      data = await scrapePopularPage();
    }

    const result = await saveScrapedData(data);
    console.log("[Manual Scrape] Completed:", result);
    return result;
  } catch (error) {
    console.error("[Manual Scrape] Failed:", error);
    throw error;
  }
}

/**
 * 사용자 알림 체크 실행
 */
async function runUserAlertCheck(): Promise<void> {
  console.log("[Scheduler:UserAlerts] Starting user alert check at", new Date().toISOString());
  
  try {
    const { checkAllUserAlerts } = await import("./userAlertChecker");
    const result = await checkAllUserAlerts();
    
    console.log("[Scheduler:UserAlerts] Check completed:", {
      checked: result.checked,
      notified: result.notified,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Scheduler:UserAlerts] Check failed:", error);
  }
}
