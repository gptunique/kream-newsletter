import { describe, it, expect, beforeAll } from "vitest";
import { createUserAlert, getUserAlertById, upsertUser, upsertProduct } from "./db";

describe("Target Price Alerts", () => {
  let testUserId: number;
  let testProductId: number;

  beforeAll(async () => {
    // 테스트 사용자 생성
    await upsertUser({
      openId: "test-target-price-001",
      name: "Test User",
      email: "test-target@example.com",
    });

    const { getUserByOpenId } = await import("./db");
    const user = await getUserByOpenId("test-target-price-001");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // 테스트 제품 생성
    await upsertProduct({
      kreamId: "test-product-target-001",
      brand: "Nike",
      name: "Test Sneakers for Target Price",
      nameKo: "목표 가격 테스트 스니커즈",
      thumbnailUrl: "https://example.com/image.jpg",
      detailUrl: "https://kream.co.kr/products/99999",
      category: "sneakers",
    });

    const { getProductByKreamId } = await import("./db");
    const product = await getProductByKreamId("test-product-target-001");
    if (!product) throw new Error("Failed to create test product");
    testProductId = product.id;
  });

  it("should create alert with percent_change type", async () => {
    const result = await createUserAlert({
      userId: testUserId,
      productId: testProductId,
      productUrl: "https://kream.co.kr/products/99999",
      productName: "목표 가격 테스트 스니커즈",
      currentPrice: 100000,
      alertType: "percent_change",
      thresholdPercent: 15,
    });

    expect(result.insertId).toBeGreaterThan(0);

    const alert = await getUserAlertById(result.insertId);
    expect(alert?.alertType).toBe("percent_change");
    expect(alert?.thresholdPercent).toBe(15);
    expect(alert?.targetPrice).toBeNull();
  });

  it("should create alert with price_below type", async () => {
    const result = await createUserAlert({
      userId: testUserId,
      productId: testProductId,
      productUrl: "https://kream.co.kr/products/99999",
      productName: "목표 가격 테스트 스니커즈",
      currentPrice: 150000,
      alertType: "price_below",
      targetPrice: 120000,
    });

    expect(result.insertId).toBeGreaterThan(0);

    const alert = await getUserAlertById(result.insertId);
    expect(alert?.alertType).toBe("price_below");
    expect(alert?.targetPrice).toBe(120000);
    expect(alert?.thresholdPercent).toBeNull();
  });

  it("should create alert with price_above type", async () => {
    const result = await createUserAlert({
      userId: testUserId,
      productId: testProductId,
      productUrl: "https://kream.co.kr/products/99999",
      productName: "목표 가격 테스트 스니커즈",
      currentPrice: 100000,
      alertType: "price_above",
      targetPrice: 150000,
    });

    expect(result.insertId).toBeGreaterThan(0);

    const alert = await getUserAlertById(result.insertId);
    expect(alert?.alertType).toBe("price_above");
    expect(alert?.targetPrice).toBe(150000);
    expect(alert?.thresholdPercent).toBeNull();
  });

  it("should handle mixed alert types for same user", async () => {
    const { getUserAlerts } = await import("./db");
    const alerts = await getUserAlerts(testUserId);

    // 위에서 생성한 3개의 알림이 모두 조회되어야 함
    expect(alerts.length).toBeGreaterThanOrEqual(3);

    const types = alerts.map((a) => a.alertType);
    expect(types).toContain("percent_change");
    expect(types).toContain("price_below");
    expect(types).toContain("price_above");
  });
});
