import { describe, it, expect, beforeAll } from "vitest";
import { upsertProduct, getAllProducts, updateProduct } from "./db";

describe("Product Management", () => {
  let testProductId: number;

  beforeAll(async () => {
    // 테스트용 제품 생성
    await upsertProduct({
      kreamId: "test-product-mgmt-001",
      brand: "Nike",
      name: "Test Product Management",
      nameKo: "테스트 제품 관리",
      thumbnailUrl: "https://example.com/test-image.jpg",
      detailUrl: "https://kream.co.kr/products/99999",
      category: "sneakers",
    });

    const { getProductByKreamId } = await import("./db");
    const product = await getProductByKreamId("test-product-mgmt-001");
    if (!product) throw new Error("Failed to create test product");
    testProductId = product.id;
  });

  it("should get all products", async () => {
    const products = await getAllProducts(100);
    expect(products.length).toBeGreaterThan(0);

    const testProduct = products.find((p) => p.id === testProductId);
    expect(testProduct).toBeDefined();
    expect(testProduct?.name).toBe("Test Product Management");
  });

  it("should update product name", async () => {
    const result = await updateProduct(testProductId, {
      name: "Updated Test Product",
    });

    expect(result.success).toBe(true);

    const { getProductByKreamId } = await import("./db");
    const updatedProduct = await getProductByKreamId("test-product-mgmt-001");
    expect(updatedProduct?.name).toBe("Updated Test Product");
  });

  it("should update product nameKo", async () => {
    const result = await updateProduct(testProductId, {
      nameKo: "업데이트된 테스트 제품",
    });

    expect(result.success).toBe(true);

    const { getProductByKreamId } = await import("./db");
    const updatedProduct = await getProductByKreamId("test-product-mgmt-001");
    expect(updatedProduct?.nameKo).toBe("업데이트된 테스트 제품");
  });

  it("should update product thumbnailUrl", async () => {
    const newUrl = "https://example.com/updated-image.jpg";
    const result = await updateProduct(testProductId, {
      thumbnailUrl: newUrl,
    });

    expect(result.success).toBe(true);

    const { getProductByKreamId } = await import("./db");
    const updatedProduct = await getProductByKreamId("test-product-mgmt-001");
    expect(updatedProduct?.thumbnailUrl).toBe(newUrl);
  });

  it("should update multiple fields at once", async () => {
    const result = await updateProduct(testProductId, {
      name: "Multi Update Test",
      nameKo: "다중 업데이트 테스트",
      thumbnailUrl: "https://example.com/multi-update.jpg",
    });

    expect(result.success).toBe(true);

    const { getProductByKreamId } = await import("./db");
    const updatedProduct = await getProductByKreamId("test-product-mgmt-001");
    expect(updatedProduct?.name).toBe("Multi Update Test");
    expect(updatedProduct?.nameKo).toBe("다중 업데이트 테스트");
    expect(updatedProduct?.thumbnailUrl).toBe("https://example.com/multi-update.jpg");
  });
});
