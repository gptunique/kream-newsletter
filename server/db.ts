import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * 제품 썸네일 URL 업데이트
 */
export async function updateProductThumbnail(productId: number, thumbnailUrl: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(products).set({ thumbnailUrl }).where(eq(products.id, productId));
  return { success: true };
}

/**
 * 제품별 가격 히스토리 조회
 */
export async function getPriceHistory(productId: number, days: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get price history: database not available");
    return [];
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await db
    .select({
      price: rankings.price,
      recordedAt: rankings.recordedAt,
    })
    .from(rankings)
    .where(eq(rankings.productId, productId))
    .orderBy(rankings.recordedAt);

  return result;
}

// TODO: add feature queries here as your schema grows.

import { InsertProduct, InsertRanking, InsertDailySnapshot, rankings, dailySnapshots } from "../drizzle/schema";
import { desc, and, sql } from "drizzle-orm";

/**
 * 제품 삽입 또는 업데이트 (kreamId 기준)
 */
export async function upsertProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(products).values(product).onDuplicateKeyUpdate({
    set: {
      brand: product.brand,
      name: product.name,
      nameKo: product.nameKo,
      thumbnailUrl: product.thumbnailUrl,
      detailUrl: product.detailUrl,
      category: product.category,
      updatedAt: new Date(),
    },
  });
}

/**
 * 랭킹 데이터 삽입
 */
export async function insertRanking(ranking: InsertRanking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(rankings).values(ranking);
}

/**
 * 일별 스냅샷 저장
 */
export async function saveDailySnapshot(snapshot: InsertDailySnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(dailySnapshots).values(snapshot).onDuplicateKeyUpdate({
    set: {
      data: snapshot.data,
    },
  });
}

/**
 * 최신 랭킹 조회 (TOP 30)
 */
export async function getLatestRankings() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      rankingId: rankings.id,
      rank: rankings.rank,
      price: rankings.price,
      tradeVolume: rankings.tradeVolume,
      wishCount: rankings.wishCount,
      recordedAt: rankings.recordedAt,
      productId: products.id,
      kreamId: products.kreamId,
      brand: products.brand,
      name: products.name,
      nameKo: products.nameKo,
      thumbnailUrl: products.thumbnailUrl,
      detailUrl: products.detailUrl,
    })
    .from(rankings)
    .innerJoin(products, eq(rankings.productId, products.id))
    .orderBy(desc(rankings.recordedAt), rankings.rank)
    .limit(30);

  return result;
}

/**
 * 특정 날짜 랭킹 조회
 */
export async function getRankingsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      rankingId: rankings.id,
      rank: rankings.rank,
      price: rankings.price,
      tradeVolume: rankings.tradeVolume,
      wishCount: rankings.wishCount,
      recordedAt: rankings.recordedAt,
      productId: products.id,
      kreamId: products.kreamId,
      brand: products.brand,
      name: products.name,
      nameKo: products.nameKo,
      thumbnailUrl: products.thumbnailUrl,
      detailUrl: products.detailUrl,
    })
    .from(rankings)
    .innerJoin(products, eq(rankings.productId, products.id))
    .where(and(
      sql`${rankings.recordedAt} >= ${startOfDay}`,
      sql`${rankings.recordedAt} <= ${endOfDay}`
    ))
    .orderBy(rankings.rank);

  return result;
}

/**
 * 제품 ID로 제품 조회
 */
export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * kreamId로 제품 조회
 */
export async function getProductByKreamId(kreamId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.kreamId, kreamId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

import { InsertUserAlert, userAlerts } from "../drizzle/schema";

/**
 * 사용자 알림 등록
 */
export async function createUserAlert(alert: InsertUserAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userAlerts).values(alert);
  
  // 생성된 ID 조회
  const insertId = Number(result[0].insertId);
  return { insertId };
}

/**
 * 사용자의 모든 알림 조회
 */
export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: userAlerts.id,
      productId: userAlerts.productId,
      productUrl: userAlerts.productUrl,
      productName: userAlerts.productName,
      currentPrice: userAlerts.currentPrice,
      alertType: userAlerts.alertType,
      thresholdPercent: userAlerts.thresholdPercent,
      targetPrice: userAlerts.targetPrice,
      isActive: userAlerts.isActive,
      lastNotifiedAt: userAlerts.lastNotifiedAt,
      createdAt: userAlerts.createdAt,
      brand: products.brand,
      thumbnailUrl: products.thumbnailUrl,
    })
    .from(userAlerts)
    .leftJoin(products, eq(userAlerts.productId, products.id))
    .where(eq(userAlerts.userId, userId))
    .orderBy(desc(userAlerts.createdAt));

  return result;
}

/**
 * 특정 알림 조회
 */
export async function getUserAlertById(alertId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userAlerts).where(eq(userAlerts.id, alertId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 알림 삭제
 */
export async function deleteUserAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userAlerts).where(and(eq(userAlerts.id, alertId), eq(userAlerts.userId, userId)));
  return { success: true };
}

/**
 * 알림 활성화/비활성화 토글
 */
export async function toggleUserAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const alert = await getUserAlertById(alertId);
  if (!alert || alert.userId !== userId) {
    throw new Error("Alert not found or unauthorized");
  }

  const newStatus = alert.isActive === 1 ? 0 : 1;
  await db.update(userAlerts).set({ isActive: newStatus }).where(eq(userAlerts.id, alertId));

  return { success: true, isActive: newStatus };
}

/**
 * 알림 가격 업데이트
 */
export async function updateUserAlertPrice(alertId: number, currentPrice: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userAlerts).set({ currentPrice, updatedAt: new Date() }).where(eq(userAlerts.id, alertId));
  return { success: true };
}

/**
 * 알림 마지막 알림 시간 업데이트
 */
export async function updateUserAlertNotifiedAt(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userAlerts).set({ lastNotifiedAt: new Date() }).where(eq(userAlerts.id, alertId));
  return { success: true };
}

/**
 * 모든 활성 알림 조회 (가격 체크용)
 */
export async function getAllActiveAlerts() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: userAlerts.id,
      userId: userAlerts.userId,
      productId: userAlerts.productId,
      productUrl: userAlerts.productUrl,
      productName: userAlerts.productName,
      currentPrice: userAlerts.currentPrice,
      alertType: userAlerts.alertType,
      thresholdPercent: userAlerts.thresholdPercent,
      targetPrice: userAlerts.targetPrice,
      lastNotifiedAt: userAlerts.lastNotifiedAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(userAlerts)
    .innerJoin(users, eq(userAlerts.userId, users.id))
    .where(eq(userAlerts.isActive, 1));

  return result;
}

/**
 * 모든 사용자 조회 (관리자용)
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return result;
}

/**
 * 사용자 역할 변경 (관리자용)
 */
export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

/**
 * 알림 통계 조회 (관리자용)
 */
export async function getAlertStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, byType: {} };

  // 전체 알림 수
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(userAlerts);
  const total = totalResult[0]?.count || 0;

  // 활성 알림 수
  const activeResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(userAlerts)
    .where(eq(userAlerts.isActive, 1));
  const active = activeResult[0]?.count || 0;

  // 타입별 알림 수
  const byTypeResult = await db
    .select({
      alertType: userAlerts.alertType,
      count: sql<number>`count(*)`,
    })
    .from(userAlerts)
    .groupBy(userAlerts.alertType);

  const byType = byTypeResult.reduce(
    (acc, row) => {
      acc[row.alertType] = row.count;
      return acc;
    },
    {} as Record<string, number>
  );

  return { total, active, byType };
}

/**
 * 전체 알림 목록 조회 (관리자용)
 */
export async function getAllAlertsForAdmin() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: userAlerts.id,
      userId: userAlerts.userId,
      userName: users.name,
      userEmail: users.email,
      productName: userAlerts.productName,
      productUrl: userAlerts.productUrl,
      currentPrice: userAlerts.currentPrice,
      alertType: userAlerts.alertType,
      thresholdPercent: userAlerts.thresholdPercent,
      targetPrice: userAlerts.targetPrice,
      isActive: userAlerts.isActive,
      lastNotifiedAt: userAlerts.lastNotifiedAt,
      createdAt: userAlerts.createdAt,
    })
    .from(userAlerts)
    .innerJoin(users, eq(userAlerts.userId, users.id))
    .orderBy(desc(userAlerts.createdAt))
    .limit(100);

  return result;
}

/**
 * 스크래핑 히스토리 조회 (관리자용)
 */
export async function getScrapingHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: dailySnapshots.id,
      snapshotDate: dailySnapshots.snapshotDate,
      createdAt: dailySnapshots.createdAt,
    })
    .from(dailySnapshots)
    .orderBy(desc(dailySnapshots.createdAt))
    .limit(limit);

  // data 필드를 파싱하여 제품 수 계산
  return result.map((row) => ({
    ...row,
    totalProducts: 0, // data JSON을 파싱하면 실제 개수를 얻을 수 있음
  }));
}

/**
 * 대시보드 통계 조회 (관리자용)
 */
export async function getDashboardStats() {
  const db = await getDb();
  if (!db)
    return {
      totalUsers: 0,
      totalAlerts: 0,
      activeAlerts: 0,
      totalProducts: 0,
      recentScrapings: 0,
    };

  // 전체 사용자 수
  const usersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const totalUsers = usersResult[0]?.count || 0;

  // 전체 알림 수
  const alertsResult = await db.select({ count: sql<number>`count(*)` }).from(userAlerts);
  const totalAlerts = alertsResult[0]?.count || 0;

  // 활성 알림 수
  const activeAlertsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(userAlerts)
    .where(eq(userAlerts.isActive, 1));
  const activeAlerts = activeAlertsResult[0]?.count || 0;

  // 전체 제품 수
  const productsResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const totalProducts = productsResult[0]?.count || 0;

  // 최근 7일 스크래핑 수
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentScrapingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailySnapshots)
    .where(sql`${dailySnapshots.createdAt} >= ${sevenDaysAgo}`);
  const recentScrapings = recentScrapingsResult[0]?.count || 0;

  return {
    totalUsers,
    totalAlerts,
    activeAlerts,
    totalProducts,
    recentScrapings,
  };
}

/**
 * 알림 일괄 비활성화 (관리자용)
 */
export async function bulkDeactivateAlerts(alertIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (alertIds.length === 0) return { success: true, count: 0 };

  await db.update(userAlerts).set({ isActive: 0 }).where(sql`${userAlerts.id} IN (${sql.join(alertIds, sql`, `)})`);

  return { success: true, count: alertIds.length };
}

/**
 * 알림 일괄 삭제 (관리자용)
 */
export async function bulkDeleteAlerts(alertIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (alertIds.length === 0) return { success: true, count: 0 };

  await db.delete(userAlerts).where(sql`${userAlerts.id} IN (${sql.join(alertIds, sql`, `)})`);

  return { success: true, count: alertIds.length };
}

/**
 * 제품 정보 수정 (관리자용)
 */
export async function updateProduct(productId: number, updates: { name?: string; nameKo?: string; thumbnailUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set(updates).where(eq(products.id, productId));

  return { success: true };
}

/**
 * 전체 제품 목록 조회 (관리자용)
 */
export async function getAllProducts(limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: products.id,
      kreamId: products.kreamId,
      brand: products.brand,
      name: products.name,
      nameKo: products.nameKo,
      thumbnailUrl: products.thumbnailUrl,
      detailUrl: products.detailUrl,
      category: products.category,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(limit);
}
