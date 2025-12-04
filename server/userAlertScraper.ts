import { browserPool } from "./browserPool";

interface ProductInfo {
  brand: string;
  name: string;
  nameKo: string;
  thumbnailUrl: string;
  price: number;
}

/**
 * KREAM 제품 URL에서 제품 정보 스크래핑
 */
export async function scrapeProductFromUrl(productUrl: string): Promise<ProductInfo> {
  await browserPool.initialize();
  const context = await browserPool.acquireContext();
  const page = await context.newPage();

  try {
    await page.goto(productUrl, { waitUntil: "networkidle", timeout: 30000 });

    // 랜덤 대기 (사람처럼 행동)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));

    const productData = await page.evaluate(() => {
      // 브랜드 추출
      const brandElement = document.querySelector(".brand, [class*='brand']");
      const brand = brandElement?.textContent?.trim() || "Unknown";

      // 제품명 추출
      const nameElement = document.querySelector(".name, [class*='name'], h1");
      const name = nameElement?.textContent?.trim() || "";

      // 가격 추출 (즉시 구매가)
      const priceElement = document.querySelector(".amount, .price, [class*='price']");
      const priceText = priceElement?.textContent?.replace(/[^0-9]/g, "") || "0";
      const price = parseInt(priceText, 10);

      // 썸네일 URL 추출
      const imgElement = document.querySelector("img[class*='product'], img[alt*='product']");
      const thumbnailUrl = imgElement?.getAttribute("src") || "";

      return {
        brand,
        name,
        nameKo: name,
        thumbnailUrl,
        price,
      };
    });

    await page.close();
    browserPool.releaseContext(context);

    return productData;
  } catch (error) {
    console.error("Error scraping product from URL:", error);
    await page.close();
    browserPool.releaseContext(context);
    throw error;
  }
}
