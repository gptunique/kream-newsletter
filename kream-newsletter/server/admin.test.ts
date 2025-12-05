import { describe, it, expect, beforeAll } from "vitest";
import { upsertUser, updateUserRole, getAllUsers, getAlertStats, getDashboardStats } from "./db";

describe("Admin Features", () => {
  let adminUserId: number;
  let regularUserId: number;

  beforeAll(async () => {
    // 관리자 사용자 생성
    await upsertUser({
      openId: "test-admin-001",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    });

    const { getUserByOpenId } = await import("./db");
    const adminUser = await getUserByOpenId("test-admin-001");
    if (!adminUser) throw new Error("Failed to create admin user");
    adminUserId = adminUser.id;

    // 일반 사용자 생성
    await upsertUser({
      openId: "test-regular-001",
      name: "Regular User",
      email: "regular@example.com",
    });

    const regularUser = await getUserByOpenId("test-regular-001");
    if (!regularUser) throw new Error("Failed to create regular user");
    regularUserId = regularUser.id;
  });

  it("should get all users", async () => {
    const users = await getAllUsers();
    expect(users.length).toBeGreaterThan(0);

    const adminUser = users.find((u) => u.id === adminUserId);
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe("admin");

    const regularUser = users.find((u) => u.id === regularUserId);
    expect(regularUser).toBeDefined();
    expect(regularUser?.role).toBe("user");
  });

  it("should update user role from user to admin", async () => {
    await updateUserRole(regularUserId, "admin");

    const { getUserByOpenId } = await import("./db");
    const updatedUser = await getUserByOpenId("test-regular-001");
    expect(updatedUser?.role).toBe("admin");
  });

  it("should update user role from admin to user", async () => {
    await updateUserRole(regularUserId, "user");

    const { getUserByOpenId } = await import("./db");
    const updatedUser = await getUserByOpenId("test-regular-001");
    expect(updatedUser?.role).toBe("user");
  });

  it("should get alert statistics", async () => {
    const stats = await getAlertStats();
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.active).toBe("number");
    expect(typeof stats.byType).toBe("object");
  });

  it("should get dashboard statistics", async () => {
    const stats = await getDashboardStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalUsers).toBe("number");
    expect(typeof stats.totalAlerts).toBe("number");
    expect(typeof stats.activeAlerts).toBe("number");
    expect(typeof stats.totalProducts).toBe("number");
    expect(typeof stats.recentScrapings).toBe("number");

    // 생성한 테스트 사용자가 포함되어야 함
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
  });
});
