import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './products.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productRepository: Model<Product>,
  ) {}

  async getProducts() {
    return await this.productRepository.find();
  }

  async getProductById(id: string) {
    return await this.productRepository.findById(id);
  }
}
