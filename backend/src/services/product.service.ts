import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "../domain/products/product.types.js";

import { ProductRepository } from "../repositories/product.repository.js";

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async createProduct(
    input: CreateProductInput,
  ): Promise<Product> {
    const existingProduct =
      await this.productRepository.findBySku(input.sku);

    if (existingProduct) {
      throw new Error("Product with this SKU already exists");
    }

    return this.productRepository.create(input);
  }

  async getProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async updateProduct(
    id: number,
    input: UpdateProductInput,
  ): Promise<Product | null> {
    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      return null;
    }

    if (input.sku && input.sku !== existingProduct.sku) {
      const productWithSku =
        await this.productRepository.findBySku(input.sku);

      if (
        productWithSku &&
        productWithSku.id !== id
      ) {
        throw new Error("Product with this SKU already exists");
      }
    }

    return this.productRepository.update(id, input);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.productRepository.delete(id);
  }
}
