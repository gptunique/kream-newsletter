import { describe, it, expect, beforeAll } from "vitest";
import {
  upsertUser,
  upsertProduct,
  createUserAlert,
  bulkDeactivateAlerts,
  bulkDeleteAlerts,
  getUserAlerts,
} from "./db";

describe("Bulk Alert Management", () => {
  let testUserId: number;
  let testProductId: number;
  let alertIds: number[] = [];

  beforeAll(async () => {
    // 테스트 사용자 생성
    await upsertUser({
      openId: "test-bulk-001",
      name: "Bulk Test User",
      email: "bulk@example.com",
    });

    const { getUserByOpenId } = await import("./db");
    const user = await getUserByOpenId("test-bulk-001");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // 테스트 제품 생성
    await upsertProduct({
      kreamId: "test-product-bulk-001",
      brand: "Nike",
      name: "Bulk Test Sneakers",
      nameKo: "일괄 테스트 스니커즈",
      thumbnailUrl: "https://example.com/image.jpg",
      detailUrl: "https://kream.co.kr/products/88888",
      category: "sneakers",
    });

    const { getProductByKreamId } = await import("./db");
    const product = await getProductByKreamId("test-product-bulk-001");
    if (!product) throw new Error("Failed to create test product");
    testProductId = product.id;

    // 테스트용 알림 3개 생성
    for (let i = 0; i < 3; i++) {
      const result = await createUserAlert({
        userId: testUserId,
        productId: testProductId,
        productUrl: "https://kream.co.kr/products/88888",
        productName: `일괄 테스트 스니커즈 ${i + 1}`,
        currentPrice: 100000 + i * 10000,
        alertType: "percent_change",
        thresholdPercent: 10,
      });
      alertIds.push(result.insertId);
    }
  });

  it("should bulk deactivate alerts", async () => {
    // 2개 알림 비활성화
    const targetIds = [alertIds[0], alertIds[1]];
    const result = await bulkDeactivateAlerts(targetIds);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // 비활성화 확인
    const alerts = await getUserAlerts(testUserId);
    const deactivatedAlerts = alerts.filter((a) => targetIds.includes(a.id));
    expect(deactivatedAlerts.every((a) => a.isActive === 0)).toBe(true);
  });

  it("should bulk delete alerts", async () => {
    // 2개 알림 삭제
    const targetIds = [alertIds[0], alertIds[1]];
    const result = await bulkDeleteAlerts(targetIds);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // 삭제 확인
    const alerts = await getUserAlerts(testUserId);
    const deletedAlerts = alerts.filter((a) => targetIds.includes(a.id));
    expect(deletedAlerts.length).toBe(0);

    // 삭제되지 않은 알림 확인
    const remainingAlert = alerts.find((a) => a.id === alertIds[2]);
    expect(remainingAlert).toBeDefined();
  });

  it("should handle empty array gracefully", async () => {
    const result = await bulkDeactivateAlerts([]);
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);

    const deleteResult = await bulkDeleteAlerts([]);
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.count).toBe(0);
  });
});
