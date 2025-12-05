import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// 관리자 전용 프로시저
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  rankings: router({
    latest: publicProcedure.query(async () => {
      const { getLatestRankings } = await import("./db");
      return await getLatestRankings();
    }),
    byDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const { getRankingsByDate } = await import("./db");
        const date = new Date(input.date);
        return await getRankingsByDate(date);
      }),
  }),

  products: router({
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProductById } = await import("./db");
        return await getProductById(input.id);
      }),
    updateThumbnail: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          thumbnailUrl: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // admin 권한 체크
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can update product thumbnails",
          });
        }

        const { updateProductThumbnail } = await import("./db");
        return await updateProductThumbnail(input.productId, input.thumbnailUrl);
      }),
    priceHistory: publicProcedure
      .input(
        z.object({
          productId: z.number(),
          days: z.number().optional().default(30),
        })
      )
      .query(async ({ input }) => {
        const { getPriceHistory } = await import("./db");
        return await getPriceHistory(input.productId, input.days);
      }),
  }),

  userAlerts: router({
    // 사용자 알림 목록 조회
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAlerts } = await import("./db");
      return await getUserAlerts(ctx.user.id);
    }),

    // 새 알림 등록
    create: protectedProcedure
      .input(
        z.object({
          productUrl: z.string().url(),
          alertType: z.enum(["percent_change", "price_below", "price_above"]).default("percent_change"),
          thresholdPercent: z.number().min(1).max(100).optional(),
          targetPrice: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createUserAlert, getProductByKreamId, upsertProduct } = await import("./db");
        const { scrapeProductFromUrl } = await import("./userAlertScraper");

        // URL에서 KREAM ID 추출
        const kreamIdMatch = input.productUrl.match(/products\/(\d+)/);
        if (!kreamIdMatch) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid KREAM product URL",
          });
        }

        const kreamId = kreamIdMatch[1];

        // 제품 정보 스크래핑
        const productData = await scrapeProductFromUrl(input.productUrl);

        // 제품 DB에 저장
        await upsertProduct({
          kreamId,
          brand: productData.brand,
          name: productData.name,
          nameKo: productData.nameKo,
          thumbnailUrl: productData.thumbnailUrl,
          detailUrl: input.productUrl,
          category: "sneakers",
        });

        // 제품 ID 조회
        const product = await getProductByKreamId(kreamId);
        if (!product) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save product",
          });
        }

        // 입력 검증
        if (input.alertType === "percent_change" && !input.thresholdPercent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "변동률 알림은 임계값을 설정해야 합니다.",
          });
        }
        if ((input.alertType === "price_below" || input.alertType === "price_above") && !input.targetPrice) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "목표 가격 알림은 목표 가격을 설정해야 합니다.",
          });
        }

        // 알림 등록
        await createUserAlert({
          userId: ctx.user.id,
          productId: product.id,
          productUrl: input.productUrl,
          productName: productData.nameKo || productData.name,
          currentPrice: productData.price,
          alertType: input.alertType,
          thresholdPercent: input.thresholdPercent,
          targetPrice: input.targetPrice,
        });

        return { success: true, product: productData };
      }),

    // 알림 삭제
    delete: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteUserAlert } = await import("./db");
        return await deleteUserAlert(input.alertId, ctx.user.id);
      }),

    // 알림 활성화/비활성화 토글
    toggle: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { toggleUserAlert } = await import("./db");
        return await toggleUserAlert(input.alertId, ctx.user.id);
      }),
  }),

  admin: router({
    // 사용자 목록 조회
    users: adminProcedure.query(async () => {
      const { getAllUsers } = await import("./db");
      return await getAllUsers();
    }),

    // 사용자 역할 변경
    updateUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["admin", "user"]),
        })
      )
      .mutation(async ({ input }) => {
        const { updateUserRole } = await import("./db");
        return await updateUserRole(input.userId, input.role);
      }),

    // 알림 통계
    alertStats: adminProcedure.query(async () => {
      const { getAlertStats } = await import("./db");
      return await getAlertStats();
    }),

    // 전체 알림 목록
    allAlerts: adminProcedure.query(async () => {
      const { getAllAlertsForAdmin } = await import("./db");
      return await getAllAlertsForAdmin();
    }),

    // 스크래핑 히스토리
    scrapingHistory: adminProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ input }) => {
        const { getScrapingHistory } = await import("./db");
        return await getScrapingHistory(input.limit);
      }),

    // 대시보드 통계
    dashboardStats: adminProcedure.query(async () => {
      const { getDashboardStats } = await import("./db");
      return await getDashboardStats();
    }),

    // 알림 일괄 비활성화
    bulkDeactivateAlerts: adminProcedure
      .input(
        z.object({
          alertIds: z.array(z.number()).min(1),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkDeactivateAlerts } = await import("./db");
        return await bulkDeactivateAlerts(input.alertIds);
      }),

    // 알림 일괄 삭제
    bulkDeleteAlerts: adminProcedure
      .input(
        z.object({
          alertIds: z.array(z.number()).min(1),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkDeleteAlerts } = await import("./db");
        return await bulkDeleteAlerts(input.alertIds);
      }),

    // 전체 제품 목록 조회
    products: adminProcedure
      .input(
        z.object({
          limit: z.number().optional().default(100),
        })
      )
      .query(async ({ input }) => {
        const { getAllProducts } = await import("./db");
        return await getAllProducts(input.limit);
      }),

    // 제품 정보 수정
    updateProduct: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          name: z.string().optional(),
          nameKo: z.string().optional(),
          thumbnailUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateProduct } = await import("./db");
        const { productId, ...updates } = input;
        return await updateProduct(productId, updates);
      }),

    // 제품 이미지 업로드
    uploadProductImage: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          imageBase64: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const { updateProduct } = await import("./db");

        // Base64 디코딩
        const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // S3에 업로드 (랜덤 suffix 추가하여 열거 방지)
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileKey = `product-images/${input.productId}-${randomSuffix}.${input.mimeType.split("/")[1]}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // 제품 정보 업데이트
        await updateProduct(input.productId, { thumbnailUrl: url });

        return { success: true, url };
      }),
  }),

  scraper: router({
    trigger: publicProcedure
      .input(z.object({ mode: z.enum(["mock", "realtime", "popular"]) }))
      .mutation(async ({ input }) => {
        const { scrapeMockData, scrapeRealtimeData, scrapePopularPage, saveScrapedData } = await import("./scraper");
        
        let data;
        if (input.mode === "mock") {
          data = await scrapeMockData();
        } else if (input.mode === "realtime") {
          data = await scrapeRealtimeData();
        } else {
          data = await scrapePopularPage();
        }

        const result = await saveScrapedData(data);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
