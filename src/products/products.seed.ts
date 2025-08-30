import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './products.entity';

const products: {
  name: string;
  value: number;
  price: number;
  productId: string;
}[] = [];
const topics: string[] = [
  'Birthday Suprise',
  'Praise Mom’s Cooking',
  'Hype Up My Bestie',
  'Exam Motivation',
  'Ex-Exposed',
  'Flirt 101',
  'Resign to My Boss',
  'Break-Up Roast',
  'Other',
];

@Injectable({ scope: Scope.DEFAULT })
export class SubscriptionPlanSeeding implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
  ) {}

  async onModuleInit() {
    try {
      // await this.seedproducts();
    } catch (error) {
      console.error('Error seeding Products:', error);
    }
  }

  private async seedproducts() {
    const getProducts = await this.productRepository.find();

    for (const product of products) {
      const existingProduct = getProducts.find((p) => p.name === product.name);
    }
  }
}
