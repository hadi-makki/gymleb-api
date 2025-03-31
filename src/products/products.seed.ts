import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './products.entity';

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
    @InjectModel(Product.name)
    private productRepository: Model<Product>,
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
