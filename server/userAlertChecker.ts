import { getAllActiveAlerts, updateUserAlertPrice, updateUserAlertNotifiedAt } from "./db";
import { scrapeProductFromUrl } from "./userAlertScraper";
import { notifyUser } from "./_core/notification";

/**
 * 모든 활성 알림의 가격을 체크하고 변동 시 알림 전송
 */
export async function checkAllUserAlerts() {
  console.log("[UserAlertChecker] Starting user alert check...");
  const startTime = Date.now();

  const alerts = await getAllActiveAlerts();
  console.log(`[UserAlertChecker] Found ${alerts.length} active alerts`);

  let notifiedCount = 0;

  for (const alert of alerts) {
    try {
      // 제품 URL에서 현재 가격 스크래핑
      const productData = await scrapeProductFromUrl(alert.productUrl);
      const newPrice = productData.price;
      const oldPrice = alert.currentPrice || 0;

      // 알림 조건 확인
      let shouldNotify = false;
      let notificationMessage = "";

      if (alert.alertType === "percent_change" && alert.thresholdPercent && oldPrice > 0) {
        // 변동률 기반 알림
        const changePercent = Math.abs(((newPrice - oldPrice) / oldPrice) * 100);
        if (changePercent >= alert.thresholdPercent) {
          shouldNotify = true;
          const direction = newPrice > oldPrice ? "상승" : "하락";
          const emoji = newPrice > oldPrice ? "📈" : "📉";
          notificationMessage = `${emoji} 가격 ${direction} 알림: ${alert.productName}

제품: ${alert.productName}
이전 가격: ${oldPrice.toLocaleString()}원
현재 가격: ${newPrice.toLocaleString()}원
변동률: ${changePercent.toFixed(1)}%

제품 보기: ${alert.productUrl}`;
        }
      } else if (alert.alertType === "price_below" && alert.targetPrice) {
        // 목표 가격 이하 알림
        if (newPrice <= alert.targetPrice && oldPrice > alert.targetPrice) {
          shouldNotify = true;
          notificationMessage = `🎉 목표 가격 도달: ${alert.productName}

제품: ${alert.productName}
목표 가격: ${alert.targetPrice.toLocaleString()}원
현재 가격: ${newPrice.toLocaleString()}원

제품 보기: ${alert.productUrl}`;
        }
      } else if (alert.alertType === "price_above" && alert.targetPrice) {
        // 목표 가격 이상 알림
        if (newPrice >= alert.targetPrice && oldPrice < alert.targetPrice) {
          shouldNotify = true;
          notificationMessage = `🚀 목표 가격 도달: ${alert.productName}

제품: ${alert.productName}
목표 가격: ${alert.targetPrice.toLocaleString()}원
현재 가격: ${newPrice.toLocaleString()}원

제품 보기: ${alert.productUrl}`;
        }
      }

      // 알림 전송
      if (shouldNotify) {
        const [title, ...contentLines] = notificationMessage.split("\n\n");
        await notifyUser({
          userId: alert.userId,
          title,
          content: contentLines.join("\n\n").trim(),
        });

        // 마지막 알림 시간 업데이트
        await updateUserAlertNotifiedAt(alert.id);
        notifiedCount++;

        console.log(
          `[UserAlertChecker] Notified user ${alert.userId} about ${alert.productName} (type: ${alert.alertType})`
        );

        // Rate Limit 방지
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 현재 가격 업데이트
      await updateUserAlertPrice(alert.id, newPrice);

      // 요청 간 대기 (Rate Limit 회피)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[UserAlertChecker] Error checking alert ${alert.id}:`, error);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[UserAlertChecker] Completed in ${duration}s. Sent ${notifiedCount} notifications.`);

  return { success: true, checked: alerts.length, notified: notifiedCount };
}
