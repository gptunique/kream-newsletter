import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createUserAlert,
  getUserAlerts,
  getUserAlertById,
  deleteUserAlert,
  toggleUserAlert,
  updateUserAlertPrice,
  getAllActiveAlerts,
} from "./db";
import { upsertUser, upsertProduct } from "./db";

describe("User Alerts", () => {
  let testUserId: number;
  let testProductId: number;
  let testAlertId: number;

  beforeAll(async () => {
    // 테스트 사용자 생성
    await upsertUser({
      openId: "test-user-alerts-001",
      name: "Test User",
      email: "test@example.com",
    });

    const { getUserByOpenId } = await import("./db");
    const user = await getUserByOpenId("test-user-alerts-001");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // 테스트 제품 생성
    await upsertProduct({
      kreamId: "test-product-001",
      brand: "Nike",
      name: "Test Sneakers",
      nameKo: "테스트 스니커즈",
      thumbnailUrl: "https://example.com/image.jpg",
      detailUrl: "https://kream.co.kr/products/12345",
      category: "sneakers",
    });

    const { getProductByKreamId } = await import("./db");
    const product = await getProductByKreamId("test-product-001");
    if (!product) throw new Error("Failed to create test product");
    testProductId = product.id;
  });

  it("should create a user alert", async () => {
    const result = await createUserAlert({
      userId: testUserId,
      productId: testProductId,
      productUrl: "https://kream.co.kr/products/12345",
      productName: "테스트 스니커즈",
      currentPrice: 100000,
      thresholdPercent: 10,
    });

    expect(result).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
    testAlertId = Number(result.insertId);
  });

  it("should get user alerts", async () => {
    const alerts = await getUserAlerts(testUserId);

    expect(alerts).toBeDefined();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].productName).toBe("테스트 스니커즈");
    expect(alerts[0].currentPrice).toBe(100000);
  });

  it("should get alert by id", async () => {
    const alert = await getUserAlertById(testAlertId);

    expect(alert).toBeDefined();
    expect(alert?.userId).toBe(testUserId);
    expect(alert?.productId).toBe(testProductId);
    expect(alert?.isActive).toBe(1);
  });

  it("should toggle alert status", async () => {
    // 첫 번째 토글: 활성 → 비활성
    const result = await toggleUserAlert(testAlertId, testUserId);
    expect(result.success).toBe(true);
    expect(result.isActive).toBe(0);

    // 상태 확인
    let alert = await getUserAlertById(testAlertId);
    expect(alert?.isActive).toBe(0);

    // 두 번째 토글: 비활성 → 활성
    const result2 = await toggleUserAlert(testAlertId, testUserId);
    expect(result2.success).toBe(true);
    expect(result2.isActive).toBe(1);

    // 상태 확인
    alert = await getUserAlertById(testAlertId);
    expect(alert?.isActive).toBe(1);
  });

  it("should update alert price", async () => {
    // 가격 업데이트 전 확인
    let alert = await getUserAlertById(testAlertId);
    const oldPrice = alert?.currentPrice;
    expect(oldPrice).toBe(100000);

    // 가격 업데이트
    const result = await updateUserAlertPrice(testAlertId, 120000);
    expect(result.success).toBe(true);

    // 업데이트 후 확인
    alert = await getUserAlertById(testAlertId);
    expect(alert?.currentPrice).toBe(120000);
  });

  it("should get all active alerts", async () => {
    // 알림이 활성 상태인지 확인
    const alert = await getUserAlertById(testAlertId);
    expect(alert?.isActive).toBe(1);

    const alerts = await getAllActiveAlerts();

    expect(alerts).toBeDefined();
    expect(alerts.length).toBeGreaterThan(0);

    const testAlert = alerts.find((a) => a.id === testAlertId);
    expect(testAlert).toBeDefined();
    expect(testAlert?.userId).toBe(testUserId);
  });

  it("should delete user alert", async () => {
    const result = await deleteUserAlert(testAlertId, testUserId);

    expect(result.success).toBe(true);

    const alert = await getUserAlertById(testAlertId);
    expect(alert).toBeUndefined();
  });

  it("should prevent unauthorized alert deletion", async () => {
    // 새 알림 생성
    const createResult = await createUserAlert({
      userId: testUserId,
      productId: testProductId,
      productUrl: "https://kream.co.kr/products/12345",
      productName: "테스트 스니커즈 2",
      currentPrice: 150000,
      thresholdPercent: 15,
    });

    const newAlertId = Number(createResult.insertId);
    expect(newAlertId).toBeGreaterThan(0);

    // 다른 사용자 ID로 삭제 시도 (아무 행동도 하지 않음)
    await deleteUserAlert(newAlertId, 99999);

    // 알림이 여전히 존재해야 함
    const alert = await getUserAlertById(newAlertId);
    expect(alert).toBeDefined();

    // 정상 삭제
    await deleteUserAlert(newAlertId, testUserId);

    // 삭제 확인
    const deletedAlert = await getUserAlertById(newAlertId);
    expect(deletedAlert).toBeUndefined();
  });
});
