import { BrowserContext } from "playwright";
import fs from "fs/promises";
import path from "path";
import { upsertProduct, insertRanking, saveDailySnapshot, getProductByKreamId } from "./db";
import { browserPool, parallelScrape } from "./browserPool";

interface ProductData {
  kreamId?: string;
  brand: string;
  name: string;
  nameKo: string;
  thumbnailUrl: string;
  detailUrl: string;
  price: number;
  wishCount?: number;
  tradeVolume?: string;
  rank: number;
}

interface ProductTask {
  rank: number;
  brand: string;
  name: string;
  name_ko: string;
  image_url: string;
  price: number;
}

/**
 * 랜덤 대기 시간 (사람처럼 행동)
 */
function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Mock 모드: 테스트용 고정 데이터 생성
 */
export async function scrapeMockData(): Promise<ProductData[]> {
  const dataPath = path.join(process.cwd(), "data", "product_images.json");
  const fileContent = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(fileContent);

  return data.products.map((product: any, index: number) => ({
    kreamId: `mock_${product.rank}`,
    brand: product.brand,
    name: product.name,
    nameKo: product.name_ko,
    thumbnailUrl: product.image_url,
    detailUrl: `https://kream.co.kr/search?keyword=${encodeURIComponent(product.name_ko)}`,
    price: product.price,
    wishCount: Math.floor(Math.random() * 500000) + 10000,
    tradeVolume: `${(Math.random() * 100).toFixed(1)}만`,
    rank: product.rank,
  }));
}

/**
 * 단일 제품 스크래핑 함수 (병렬 처리용)
 */
async function scrapeProduct(product: ProductTask, context: BrowserContext): Promise<ProductData> {
  const page = await context.newPage();

  try {
    const searchUrl = `https://kream.co.kr/search?keyword=${encodeURIComponent(product.name_ko)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });

    // 랜덤 대기 (사람처럼 행동)
    await randomDelay(1000, 2000);

    const productData = await page.evaluate(() => {
      const firstProduct = document.querySelector(".search_result_item, .item_inner, [class*=\"product\"]");
      if (!firstProduct) return null;

      // 가격 추출
      const priceElement = firstProduct.querySelector(".amount, .price, [class*=\"price\"]");
      const priceText = priceElement?.textContent?.replace(/[^0-9]/g, "") || "0";
      const price = parseInt(priceText, 10);

      // 관심수 추출
      const wishElement = firstProduct.querySelector("[class*=\"wish\"], [class*=\"interest\"]");
      const wishText = wishElement?.textContent || "";
      const wishMatch = wishText.match(/관심\s*([\d,.]+)\s*(만)?/);
      let wishCount = 0;
      if (wishMatch) {
        const num = parseFloat(wishMatch[1].replace(/,/g, ""));
        wishCount = wishMatch[2] === "만" ? Math.floor(num * 10000) : Math.floor(num);
      }

      // 거래량 추출
      const tradeElement = firstProduct.querySelector("[class*=\"trade\"], [class*=\"volume\"]");
      const tradeText = tradeElement?.textContent || "";
      const tradeMatch = tradeText.match(/거래\s*([\d,.]+)\s*(만)?/);
      const tradeVolume = tradeMatch ? tradeMatch[0] : "0";

      // 썸네일 URL 추출
      const imgElement = firstProduct.querySelector("img");
      const thumbnailUrl = imgElement?.src || "";

      // 제품 상세 URL 추출
      const linkElement = firstProduct.querySelector("a");
      const detailUrl = linkElement?.href || "";

      // KREAM ID 추출
      const kreamIdMatch = detailUrl.match(/products\/(\d+)/);
      const kreamId = kreamIdMatch ? kreamIdMatch[1] : "";

      return {
        kreamId,
        thumbnailUrl,
        detailUrl,
        price,
        wishCount,
        tradeVolume,
      };
    });

    await page.close();

    if (productData) {
      return {
        kreamId: productData.kreamId || `realtime_${product.rank}`,
        brand: product.brand,
        name: product.name,
        nameKo: product.name_ko,
        thumbnailUrl: productData.thumbnailUrl || product.image_url,
        detailUrl: productData.detailUrl || `https://kream.co.kr/search?keyword=${encodeURIComponent(product.name_ko)}`,
        price: productData.price || product.price,
        wishCount: productData.wishCount,
        tradeVolume: productData.tradeVolume,
        rank: product.rank,
      };
    }

    throw new Error("No product data found");
  } catch (error) {
    console.error(`Error scraping ${product.name_ko}:`, error);
    await page.close();

    // 실패 시 기본값 사용
    return {
      kreamId: `realtime_${product.rank}`,
      brand: product.brand,
      name: product.name,
      nameKo: product.name_ko,
      thumbnailUrl: product.image_url,
      detailUrl: `https://kream.co.kr/search?keyword=${encodeURIComponent(product.name_ko)}`,
      price: product.price,
      wishCount: 0,
      tradeVolume: "0",
      rank: product.rank,
    };
  }
}

/**
 * 실시간 가격 조회 모드: product_images.json 기반 KREAM 검색 (병렬 처리)
 * 브라우저 재사용 및 여러 탭을 사용하여 성능 최적화
 */
export async function scrapeRealtimeData(): Promise<ProductData[]> {
  console.log("[Scraper] Starting realtime scraping with browser pool...");
  const startTime = Date.now();

  const dataPath = path.join(process.cwd(), "data", "product_images.json");
  const fileContent = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(fileContent);

  // 병렬 스크래핑 실행 (3개씩 동시 처리)
  const results = await parallelScrape<ProductTask, ProductData>(
    data.products,
    scrapeProduct,
    3 // 동시 실행 수
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`[Scraper] Realtime scraping completed in ${duration}s`);

  return results;
}

/**
 * 인기 페이지 스크래핑 모드: KREAM 인기 페이지 직접 수집
 * 브라우저 재사용으로 성능 최적화
 */
export async function scrapePopularPage(): Promise<ProductData[]> {
  console.log("[Scraper] Starting popular page scraping with browser pool...");
  const startTime = Date.now();

  await browserPool.initialize();
  const context = await browserPool.acquireContext();
  const page = await context.newPage();

  try {
    await page.goto("https://kream.co.kr/search?category_id=34", { waitUntil: "networkidle", timeout: 30000 });

    // 랜덤 대기 (사람처럼 행동)
    await randomDelay(3000, 5000);

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll(".search_result_item, .item_inner, [class*=\"product\"]");
      const results: any[] = [];

      items.forEach((item, index) => {
        if (index >= 30) return;

        // 브랜드 추출
        const brandElement = item.querySelector(".brand, [class*=\"brand\"]");
        const brand = brandElement?.textContent?.trim() || "Unknown";

        // 제품명 추출
        const nameElement = item.querySelector(".name, [class*=\"name\"]");
        const name = nameElement?.textContent?.trim() || "";

        // 가격 추출
        const priceElement = item.querySelector(".amount, .price, [class*=\"price\"]");
        const priceText = priceElement?.textContent?.replace(/[^0-9]/g, "") || "0";
        const price = parseInt(priceText, 10);

        // 썸네일 URL
        const imgElement = item.querySelector("img");
        const thumbnailUrl = imgElement?.src || "";

        // 상세 URL
        const linkElement = item.querySelector("a");
        const detailUrl = linkElement?.href || "";

        // KREAM ID
        const kreamIdMatch = detailUrl.match(/products\/(\d+)/);
        const kreamId = kreamIdMatch ? kreamIdMatch[1] : "";

        results.push({
          kreamId,
          brand,
          name,
          nameKo: name,
          thumbnailUrl,
          detailUrl,
          price,
          rank: index + 1,
        });
      });

      return results;
    });

    await page.close();
    browserPool.releaseContext(context);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[Scraper] Popular page scraping completed in ${duration}s`);

    return products;
  } catch (error) {
    console.error("Error scraping popular page:", error);
    await page.close();
    browserPool.releaseContext(context);
    return [];
  }
}

/**
 * 스크래핑 데이터를 데이터베이스에 저장
 */
export async function saveScrapedData(data: ProductData[]) {
  const recordedAt = new Date();
  const { checkPriceChangeAndNotify } = await import("./priceAlert");

  for (const item of data) {
    // 제품 정보 저장
    await upsertProduct({
      kreamId: item.kreamId,
      brand: item.brand,
      name: item.name,
      nameKo: item.nameKo,
      thumbnailUrl: item.thumbnailUrl,
      detailUrl: item.detailUrl,
      category: "sneakers",
    });

    // 제품 ID 조회
    const product = await getProductByKreamId(item.kreamId || "");
    if (!product) continue;

    // 가격 변동 감지 및 알림 (랭킹 저장 전에 실행)
    await checkPriceChangeAndNotify(
      product.id,
      item.price,
      item.nameKo || item.name
    );

    // 랭킹 정보 저장
    await insertRanking({
      productId: product.id,
      rank: item.rank,
      price: item.price,
      tradeVolume: item.tradeVolume,
      wishCount: item.wishCount,
      recordedAt,
    });
  }

  // 일별 스냅샷 저장
  await saveDailySnapshot({
    snapshotDate: recordedAt,
    data: JSON.stringify(data),
  });

  return { success: true, count: data.length, recordedAt };
}
