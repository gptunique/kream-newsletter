import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * KREAM 제품 정보 테이블
 * 스니커즈 제품의 기본 정보를 저장
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  kreamId: varchar("kreamId", { length: 128 }).unique(),
  brand: varchar("brand", { length: 128 }),
  name: text("name"),
  nameKo: text("nameKo"),
  thumbnailUrl: text("thumbnailUrl"),
  detailUrl: text("detailUrl"),
  category: varchar("category", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * 일별 랭킹 정보 테이블
 * 제품의 일별 순위, 가격, 거래량, 관심수 등을 저장
 */
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  rank: int("rank").notNull(),
  price: int("price"),
  tradeVolume: varchar("tradeVolume", { length: 64 }),
  wishCount: int("wishCount"),
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ranking = typeof rankings.$inferSelect;
export type InsertRanking = typeof rankings.$inferInsert;

/**
 * 일별 스냅샷 테이블
 * 전체 랭킹 데이터를 JSON 형태로 저장하여 빠른 조회 지원
 */
export const dailySnapshots = mysqlTable("dailySnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: timestamp("snapshotDate").notNull().unique(),
  data: text("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailySnapshot = typeof dailySnapshots.$inferSelect;
export type InsertDailySnapshot = typeof dailySnapshots.$inferInsert;

/**
 * 사용자 맞춤 알림 테이블
 * 사용자가 등록한 제품의 가격 변동 알림 설정을 저장
 */
export const userAlerts = mysqlTable("userAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  productUrl: text("productUrl").notNull(),
  productName: text("productName"),
  currentPrice: int("currentPrice"),
  // 알림 타입: percent_change (변동률), price_below (목표 가격 이하), price_above (목표 가격 이상)
  alertType: mysqlEnum("alertType", ["percent_change", "price_below", "price_above"]).default("percent_change").notNull(),
  thresholdPercent: int("thresholdPercent"), // 변동률 알림용
  targetPrice: int("targetPrice"), // 목표 가격 알림용
  isActive: int("isActive").default(1).notNull(), // 1: 활성, 0: 비활성
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAlert = typeof userAlerts.$inferSelect;
export type InsertUserAlert = typeof userAlerts.$inferInsert;