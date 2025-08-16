import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './products.entity';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { User } from '../user/user.entity';
import { MediaService } from '../media/media.service';
import { Manager } from 'src/manager/manager.entity';
import { GymService } from 'src/gym/gym.service';
import { isMongoId } from 'class-validator';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productRepository: Model<Product>,
    private readonly mediaService: MediaService,
    private readonly gymService: GymService,
  ) {}

  async getProducts(gymId: string) {
    const gym = !isMongoId(gymId)
      ? await this.gymService.getGymByGymName(gymId)
      : null;

    const products = await this.productRepository
      .find({ gym: gym ? gym.id : gymId })
      .populate('image');

    return products;
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id).populate('image');
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createProduct(
    file: Express.Multer.File,
    user: Manager,
    createProductDto: CreateProductDto,
  ) {
    let imageId = null;

    // Upload image if provided
    if (file) {
      const uploadResult = await this.mediaService.upload(file, user.id);
      imageId = uploadResult.id;
    }

    const product = await this.productRepository.create({
      ...createProductDto,
      image: imageId,
      gym: user.gym,
    });

    return {
      message: 'Product created successfully',
      data: product,
    };
  }

  async updateProduct(
    id: string,
    file: Express.Multer.File,
    user: User,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let imageId: string | null = product.image?.id;

    // Upload new image if provided
    if (file) {
      // Delete old image if exists
      if (product.image) {
        try {
          await this.mediaService.delete(product.image.toString());
        } catch (error) {
          // Continue even if deletion fails
          console.warn('Failed to delete old image:', error);
        }
      }
      const uploadResult = await this.mediaService.upload(file, user.id);
      imageId = uploadResult.id;
    }

    const updatedProduct = await this.productRepository
      .findByIdAndUpdate(
        id,
        {
          ...updateProductDto,
          image: imageId,
        },
        { new: true },
      )
      .populate('image');

    return {
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  async deleteProduct(id: string, user: User) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete associated image if exists
    if (product.image) {
      try {
        await this.mediaService.delete(product.image.toString());
      } catch (error) {
        // Continue even if deletion fails
        console.warn('Failed to delete product image:', error);
      }
    }

    await this.productRepository.findByIdAndDelete(id);

    return {
      message: 'Product deleted successfully',
    };
  }
}
