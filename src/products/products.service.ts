import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isMongoId, isUUID } from 'class-validator';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { Repository } from 'typeorm';
import { GymService } from '../gym/gym.service';
import { MediaService } from '../media/media.service';
import { User } from '../user/user.model';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductEntity } from './products.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MediaEntity } from 'src/media/media.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly mediaService: MediaService,
    private readonly gymService: GymService,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
  ) {}

  async getProducts(gymId: string) {
    const gym = !isUUID(gymId)
      ? await this.gymService.getGymByGymName(gymId)
      : null;

    const products = await this.productRepository.find({
      where: { gym: gym ? gym : { id: gymId } },
      relations: {
        images: true,
      },
    });

    return products;
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        images: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createProduct(
    file: Express.Multer.File,
    user: ManagerEntity,
    createProductDto: CreateProductDto,
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    let image: MediaEntity | null = null;

    // Upload image if provided
    if (file) {
      const uploadResult = await this.mediaService.upload(file, user.id);
      image = uploadResult;
    }

    const createProductModel = this.productRepository.create({
      ...createProductDto,
      images: [image],
      gym: gym,
      stock: createProductDto.stock,
    });
    const product = await this.productRepository.save(createProductModel);
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
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const product = await this.productRepository.findOne({
      where: { id: id, gym: gym },
      relations: {
        images: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let image: MediaEntity | null = product.images[0];

    // Upload new image if provided
    if (file) {
      // Delete old image if exists
      if (product.images[0]) {
        try {
          await this.mediaService.delete(product.images[0].id);
        } catch (error) {
          // Continue even if deletion fails
          console.warn('Failed to delete old image:', error);
        }
      }
      const uploadResult = await this.mediaService.upload(file, user.id);
      image = uploadResult;
    }

    const updatedProduct = await this.productRepository.update(id, {
      ...updateProductDto,
      images: [image],
      gym: gym,
    });

    return {
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  async deleteProduct(id: string, user: User, gymId: string) {
    const product = await this.productRepository.findOne({
      where: { id: id, gym: { id: gymId } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete associated image if exists
    if (product.images[0]) {
      try {
        await this.mediaService.delete(product.images[0].id);
      } catch (error) {
        // Continue even if deletion fails
        console.warn('Failed to delete product image:', error);
      }
    }

    await this.productRepository.delete(id);

    return {
      message: 'Product deleted successfully',
    };
  }
}
