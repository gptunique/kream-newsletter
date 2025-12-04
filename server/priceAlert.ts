import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { rankings } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

/**
 * 가격 변동 임계값 (10%)
 */
const PRICE_CHANGE_THRESHOLD = 0.1;

/**
 * 제품의 가격 변동을 감지하고 알림을 보냅니다.
 * @param productId 제품 ID
 * @param newPrice 새로운 가격
 * @param productName 제품명
 * @returns 알림 전송 여부
 */
export async function checkPriceChangeAndNotify(
  productId: number,
  newPrice: number,
  productName: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[PriceAlert] Database not available");
    return false;
  }

  try {
    // 해당 제품의 가장 최근 랭킹 데이터 조회
    const recentRankings = await db
      .select()
      .from(rankings)
      .where(eq(rankings.productId, productId))
      .orderBy(desc(rankings.recordedAt))
      .limit(2); // 최근 2개 (현재 + 이전)

    if (recentRankings.length < 2) {
      // 이전 데이터가 없으면 비교 불가
      console.log(`[PriceAlert] No previous data for product ${productId}`);
      return false;
    }

    const previousPrice = recentRankings[1]?.price;
    if (!previousPrice || previousPrice === 0) {
      console.log(`[PriceAlert] Invalid previous price for product ${productId}`);
      return false;
    }

    // 가격 변동률 계산
    const priceChange = Math.abs(newPrice - previousPrice);
    const priceChangePercent = (priceChange / previousPrice) * 100;

    console.log(`[PriceAlert] Product ${productId} price change: ${priceChangePercent.toFixed(2)}%`);

    // 10% 이상 변동 시 알림 전송
    if (priceChangePercent >= PRICE_CHANGE_THRESHOLD * 100) {
      const direction = newPrice > previousPrice ? "상승" : "하락";
      const title = `🚨 가격 ${direction} 알림: ${productName}`;
      const content = `
**제품명**: ${productName}
**이전 가격**: ${previousPrice.toLocaleString()}원
**현재 가격**: ${newPrice.toLocaleString()}원
**변동률**: ${priceChangePercent.toFixed(2)}% ${direction}
**변동 금액**: ${priceChange.toLocaleString()}원

가격이 ${PRICE_CHANGE_THRESHOLD * 100}% 이상 변동되었습니다.
      `.trim();

      const notificationSent = await notifyOwner({ title, content });

      if (notificationSent) {
        console.log(`[PriceAlert] Notification sent for product ${productId}`);
      } else {
        console.warn(`[PriceAlert] Failed to send notification for product ${productId}`);
      }

      return notificationSent;
    }

    return false;
  } catch (error) {
    console.error("[PriceAlert] Error checking price change:", error);
    return false;
  }
}

/**
 * 여러 제품의 가격 변동을 일괄 확인하고 알림을 보냅니다.
 * @param products 제품 목록 (productId, price, name)
 * @returns 알림 전송된 제품 수
 */
export async function checkMultiplePriceChanges(
  products: Array<{ productId: number; price: number; name: string }>
): Promise<number> {
  let notificationCount = 0;

  for (const product of products) {
    const notified = await checkPriceChangeAndNotify(
      product.productId,
      product.price,
      product.name
    );

    if (notified) {
      notificationCount++;
    }

    // 알림 API Rate Limit 방지를 위해 약간의 지연 추가
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (notificationCount > 0) {
    console.log(`[PriceAlert] Total ${notificationCount} notifications sent`);
  }

  return notificationCount;
}
