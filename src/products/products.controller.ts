import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { BadRequestException } from '../error/bad-request-error';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { WebpPipe } from '../pipes/webp.pipe';
import { validateImage } from '../utils/helprt-functions';
import {
  CreateProductDto,
  UpdateProductDto,
  UploadFileDto,
} from './dto/create-product.dto';
import {
  CreateProductsOfferDto,
  UpdateProductsOfferDto,
} from './dto/create-products-offer.dto';
import { ReturnProductDto } from './dto/return-product.dto';
import { TransferProductDto } from './dto/transfer-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/gym/:gymId')
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieve all products with their details with pagination support',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
  })
  async getProducts(
    @Param('gymId') gymId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    return await this.productsService.getProducts(
      gymId,
      parseInt(page),
      parseInt(limit),
      search,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieve a specific product by its ID',
  })
  @ApiOkResponse({
    description: 'Product retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  async getProductById(@Param('id') id: string) {
    return await this.productsService.getProductById(id);
  }

  @Post('create/:gymId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create product',
    description: 'Create a new product with image upload',
  })
  @ApiBody({
    type: UploadFileDto,
  })
  @ApiCreatedResponse({
    type: SuccessMessageReturn,
    description: 'Product created successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async createProduct(
    @Param('gymId') gymId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // new FileTypeValidator({
          //   fileType: imageTypes,
          // }), // Specific image types
        ],
        fileIsRequired: false,
      }),
      new WebpPipe(),
    )
    file: Express.Multer.File,
    @Req() req: Request,
    @User() user: ManagerEntity,
    @Body() body: CreateProductDto,
  ) {
    if (!validateImage(file, false)) {
      throw new BadRequestException('Invalid image type');
    }
    return await this.productsService.createProduct(file, user, body, gymId);
  }

  @Put(':gymId/:id')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update an existing product with optional image upload',
  })
  @ApiBody({
    type: UploadFileDto,
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product updated successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async updateProduct(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // new FileTypeValidator({
          //   fileType: imageTypes,
          // }), // Specific image types
        ],
        fileIsRequired: false,
      }),
      new WebpPipe(),
    )
    file: Express.Multer.File,
    @User() user: UserEntity,
    @Body() body: UpdateProductDto,
  ) {
    if (!validateImage(file)) {
      throw new BadRequestException('Invalid image type');
    }
    return await this.productsService.updateProduct(
      id,
      file,
      user,
      body,
      gymId,
    );
  }

  @Delete(':gymId/:id')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete a product by ID',
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async deleteProduct(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @User() user: UserEntity,
  ) {
    return await this.productsService.deleteProduct(id, user, gymId);
  }

  @Post('transfer/:productId')
  @ApiOperation({
    summary: 'Transfer product between gyms',
    description:
      'Transfer a product from one gym to another gym owned by the same owner',
  })
  @ApiCreatedResponse({
    description: 'Product transferred successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product or gym not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async transferProduct(
    @Param('productId') productId: string,
    @Body() transferProductDto: TransferProductDto,
    @User() user: UserEntity,
  ) {
    if (!isUUID(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    return await this.productsService.transferProduct(
      productId,
      transferProductDto.gymId,
      transferProductDto.transferQuantity,
      transferProductDto.transferedToId,
      transferProductDto.transferedToName,
    );
  }

  @Post('return/:productId')
  @ApiOperation({
    summary: 'Return transferred product to original gym',
    description: 'Return a transferred product back to its original gym',
  })
  @ApiCreatedResponse({
    description: 'Product returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product or gym not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async returnProduct(
    @Param('productId') productId: string,
    @Body() returnProductDto: ReturnProductDto,
    @User() user: UserEntity,
  ) {
    if (!isUUID(productId)) {
      throw new BadRequestException('Invalid product ID');
    }
    return await this.productsService.returnProductToGym(
      productId,
      returnProductDto.returnerGymId,
      returnProductDto.returnQuantity,
    );
  }

  // Product Offers endpoints
  @Get('offers/all')
  @ApiOperation({
    summary: 'Get all product offers',
    description: 'Retrieve all product offers',
  })
  @ApiOkResponse({
    description: 'Product offers retrieved successfully',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async getProductsOffers() {
    return await this.productsService.getProductsOffers();
  }

  @Get('offers/:id')
  @ApiOperation({
    summary: 'Get product offer by ID',
    description: 'Retrieve a specific product offer by its ID',
  })
  @ApiOkResponse({
    description: 'Product offer retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product offer not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async getProductsOfferById(@Param('id') id: string) {
    return await this.productsService.getProductsOfferById(id);
  }

  @Post('offers/create')
  @ApiOperation({
    summary: 'Create product offer',
    description: 'Create a new product offer',
  })
  @ApiCreatedResponse({
    type: SuccessMessageReturn,
    description: 'Product offer created successfully',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async createProductsOffer(
    @Body() createProductsOfferDto: CreateProductsOfferDto,
  ) {
    return await this.productsService.createProductsOffer(
      createProductsOfferDto,
    );
  }

  @Put('offers/:id')
  @ApiOperation({
    summary: 'Update product offer',
    description: 'Update an existing product offer',
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product offer updated successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product offer not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async updateProductsOffer(
    @Param('id') id: string,
    @Body() updateProductsOfferDto: UpdateProductsOfferDto,
  ) {
    return await this.productsService.updateProductsOffer(
      id,
      updateProductsOfferDto,
    );
  }

  @Delete('offers/delete/:offerId')
  @ApiOperation({
    summary: 'Delete product offer',
    description: 'Delete a product offer by ID',
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product offer deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product offer not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.products)
  async deleteProductsOffer(@Param('offerId') id: string) {
    return await this.productsService.deleteProductsOffer(id);
  }
}
