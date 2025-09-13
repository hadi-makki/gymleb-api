import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { FilterOperator, paginate } from 'nestjs-paginate';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { Repository } from 'typeorm';
import { GymService } from '../gym/gym.service';
import { MediaService } from '../media/media.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import {
  CreateProductsOfferDto,
  UpdateProductsOfferDto,
} from './dto/create-products-offer.dto';
import { ProductEntity } from './products.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MediaEntity } from 'src/media/media.entity';
import { UserEntity } from 'src/user/user.entity';
import { TransactionService } from 'src/transactions/subscription-instance.service';
import { ProductsOffersEntity } from './products-offers.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly mediaService: MediaService,
    private readonly gymService: GymService,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
    private readonly transactionService: TransactionService,
    @InjectRepository(ProductsOffersEntity)
    private readonly productsOfferRepository: Repository<ProductsOffersEntity>,
  ) {}

  async getProducts(
    gymId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const gym = !isUUID(gymId)
      ? await this.gymService.getGymByGymName(gymId)
      : null;

    const res = await paginate(
      {
        limit,
        page,
        search,
        path: 'name',
      },
      this.productRepository,
      {
        relations: {
          images: true,
        },
        sortableColumns: ['createdAt', 'updatedAt', 'name', 'price'],
        searchableColumns: ['name', 'description'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: { gym: gym ? { id: gym.id } : { id: gymId } },
        filterableColumns: {
          name: [FilterOperator.ILIKE],
          description: [FilterOperator.ILIKE],
        },
        maxLimit: 100,
      },
    );

    return res;
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
    user: UserEntity,
    updateProductDto: UpdateProductDto,
    gymId: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: id, gym: { id: gymId } },
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

    product.images = [image];
    product.name = updateProductDto.name;
    product.price = updateProductDto.price;
    product.description = updateProductDto.description;
    product.stock = updateProductDto.stock;

    const updatedProduct = await this.productRepository.save(product);

    return {
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  async deleteProduct(id: string, user: UserEntity, gymId: string) {
    const product = await this.productRepository.findOne({
      where: { id: id, gym: { id: gymId } },
      relations: {
        images: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete associated image if exists
    if (product.images?.[0]) {
      await this.mediaService.delete(product.images?.[0].id);
    }

    await this.productRepository.delete(id);

    return {
      message: 'Product deleted successfully',
    };
  }

  async transferProduct(
    productId: string,
    gymId: string,
    transferQuantity: number,
    transferedToId?: string,
    transferedToName?: string,
  ) {
    if (gymId === transferedToId) {
      throw new BadRequestException(
        'Transfered to gym is the same as the transfered from gym',
      );
    }
    const transferedFrom = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!transferedFrom) {
      throw new NotFoundException('Transfered from gym not found');
    }

    const transferedTo = transferedToId
      ? await this.gymModel.findOne({
          where: { id: transferedToId },
        })
      : transferedToName;
    if (!transferedTo) {
      throw new NotFoundException('Transfered to gym not found');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, gym: { id: gymId } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < transferQuantity) {
      throw new BadRequestException('Product stock is not enough');
    }

    const createdTransactions =
      await this.transactionService.createProductsTransferTransaction({
        transferedFrom: transferedFrom,
        transferedTo: transferedTo,
        product: product,
        transferQuantity: transferQuantity,
        receiveQuantity: transferQuantity,
      });

    product.stock -= transferQuantity;
    await this.productRepository.save(product);

    const checkIfRecieverAlreadyHasProduct =
      await this.productRepository.findOne({
        where: { originalProductId: product.id, gym: { id: transferedToId } },
      });

    if (typeof transferedTo !== 'string') {
      if (checkIfRecieverAlreadyHasProduct) {
        checkIfRecieverAlreadyHasProduct.stock += transferQuantity;
        await this.productRepository.save(checkIfRecieverAlreadyHasProduct);
        return {
          createdTransactions,
          checkIfRecieverAlreadyHasProduct,
        };
      } else {
        const createProductInReceiveGym = this.productRepository.create({
          name: product.name,
          price: product.price,
          description: product.description,
          images: product.images,
          maxDurationSeconds: product.maxDurationSeconds,
          stripeProductId: product.stripeProductId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          stock: transferQuantity,
          gym: transferedTo,
          originalProductId: product.id,
          transferedFromId: gymId,
        });
        await this.productRepository.save(createProductInReceiveGym);
        return {
          createdTransactions,
          createProductInReceiveGym,
        };
      }
    }
  }

  async returnProductToGym(
    productId: string,
    returnerGymId: string,
    returnQuantity: number,
  ) {
    // Find the product in the current gym (the one returning it)
    const product = await this.productRepository.findOne({
      where: { id: productId, gym: { id: returnerGymId } },
      relations: ['gym'],
    });

    if (!product) {
      throw new NotFoundException('Product not found in current gym');
    }

    // Check if this product was actually transferred (has originalProductId)
    if (!product.originalProductId || !product.transferedFromId) {
      throw new BadRequestException(
        'This product was not transferred and cannot be returned',
      );
    }

    if (product.stock < returnQuantity) {
      throw new BadRequestException('Product stock is not enough');
    }

    // Find the original gym (where the product should be returned to)
    const originalGym = await this.gymModel.findOne({
      where: { id: product.transferedFromId },
    });

    if (!originalGym) {
      throw new NotFoundException('Original gym not found');
    }

    // Reduce stock in the current gym
    product.stock -= returnQuantity;
    await this.productRepository.save(product);

    // Check if the original gym already has this product
    const originalProduct = await this.productRepository.findOne({
      where: {
        id: product.originalProductId,
        gym: { id: product.transferedFromId },
      },
    });

    if (originalProduct) {
      // Add stock to the existing product in the original gym
      originalProduct.stock += returnQuantity;
      await this.productRepository.save(originalProduct);
    } else {
      // Create a new product entry in the original gym
      const createProductInOriginalGym = this.productRepository.create({
        name: product.name,
        price: product.price,
        description: product.description,
        images: product.images,
        maxDurationSeconds: product.maxDurationSeconds,
        stripeProductId: product.stripeProductId,
        stock: returnQuantity,
        gym: originalGym,
        originalProductId: product.originalProductId,
        transferedFromId: null, // This is now back in the original gym
      });
      await this.productRepository.save(createProductInOriginalGym);
    }

    // Create transaction record
    await this.transactionService.createProductsReturnTransaction({
      returnedFrom: product.gym, // Current gym (returning)
      returnedTo: originalGym, // Original gym (receiving)
      product: product,
      returnQuantity: returnQuantity,
    });

    return {
      message: 'Product returned to original gym successfully',
    };
  }

  async createProductsOffer(createProductsOfferDto: CreateProductsOfferDto) {
    const productsOffer = this.productsOfferRepository.create(
      createProductsOfferDto,
    );
    return await this.productsOfferRepository.save(productsOffer);
  }

  async getProductsOffers() {
    return await this.productsOfferRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getProductsOfferById(id: string) {
    console.log('this is the id get products offer by id  ', id);
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const offer = await this.productsOfferRepository.findOne({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Product offer not found');
    }

    return offer;
  }

  async updateProductsOffer(
    id: string,
    updateProductsOfferDto: UpdateProductsOfferDto,
  ) {
    console.log('this is the id update products offer by id  ', id);
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const offer = await this.productsOfferRepository.findOne({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Product offer not found');
    }

    // Update only provided fields
    if (updateProductsOfferDto.name !== undefined) {
      offer.name = updateProductsOfferDto.name;
    }
    if (updateProductsOfferDto.discountPercentage !== undefined) {
      offer.discountPercentage = updateProductsOfferDto.discountPercentage;
    }

    return await this.productsOfferRepository.save(offer);
  }

  async deleteProductsOffer(id: string) {
    console.log('this is the id delete products offer by id  ', id);
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const offer = await this.productsOfferRepository.findOne({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Product offer not found');
    }

    await this.productsOfferRepository.delete(id);

    return {
      message: 'Product offer deleted successfully',
    };
  }
}
