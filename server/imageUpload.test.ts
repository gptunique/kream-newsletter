import { describe, it, expect, beforeAll } from "vitest";
import { upsertProduct, updateProduct } from "./db";

describe("Image Upload", () => {
  let testProductId: number;

  beforeAll(async () => {
    // 테스트용 제품 생성
    await upsertProduct({
      kreamId: "test-product-image-001",
      brand: "Nike",
      name: "Test Image Upload Product",
      nameKo: "테스트 이미지 업로드 제품",
      thumbnailUrl: "https://example.com/original.jpg",
      detailUrl: "https://kream.co.kr/products/99998",
      category: "sneakers",
    });

    const { getProductByKreamId } = await import("./db");
    const product = await getProductByKreamId("test-product-image-001");
    if (!product) throw new Error("Failed to create test product");
    testProductId = product.id;
  });

  it("should upload image to S3 and update product", async () => {
    const { storagePut } = await import("./storage");

    // 테스트용 이미지 데이터 (1x1 투명 PNG)
    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(testImageBase64, "base64");

    // S3에 업로드
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileKey = `product-images/${testProductId}-${randomSuffix}.png`;
    const { url } = await storagePut(fileKey, buffer, "image/png");

    expect(url).toBeDefined();
    expect(url).toContain(fileKey);

    // 제품 정보 업데이트
    await updateProduct(testProductId, { thumbnailUrl: url });

    // 업데이트 확인
    const { getProductByKreamId } = await import("./db");
    const updatedProduct = await getProductByKreamId("test-product-image-001");
    expect(updatedProduct?.thumbnailUrl).toBe(url);
  });

  it("should handle base64 image data correctly", () => {
    // Base64 데이터에서 헤더 제거 테스트
    const base64WithHeader = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const base64Data = base64WithHeader.replace(/^data:image\/\w+;base64,/, "");
    
    expect(base64Data).not.toContain("data:image");
    expect(base64Data.startsWith("iVBORw0KGgo")).toBe(true);

    // Buffer 변환 테스트
    const buffer = Buffer.from(base64Data, "base64");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should generate unique file keys", () => {
    const productId = 123;
    const keys = new Set<string>();

    // 10개의 고유한 키 생성
    for (let i = 0; i < 10; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const fileKey = `product-images/${productId}-${randomSuffix}.png`;
      keys.add(fileKey);
    }

    // 모든 키가 고유한지 확인
    expect(keys.size).toBe(10);
  });
});
