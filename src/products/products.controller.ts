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
  UseInterceptors,
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
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';

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

  @Post('scan/:gymId')
  @ApiOperation({
    summary: 'Scan product by code',
    description: 'Check if a product exists by its barcode/code for a gym',
  })
  @ApiOkResponse({ description: 'Scan result returned' })
  async scanProductByCode(
    @Param('gymId') gymId: string,
    @Body() body: { code: string },
  ) {
    const product = await this.productsService.getProductByCode(
      body.code,
      gymId,
    );
    return {
      found: !!product,
      data: product || null,
    };
  }

  @Put('assign-code/:gymId/:productId')
  @ApiOperation({
    summary: 'Assign code to product',
    description: 'Assign or update a barcode/code for a product in a gym',
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product code assigned successfully',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.update_products)
  async assignCodeToProduct(
    @Param('gymId') gymId: string,
    @Param('productId') productId: string,
    @Body() body: { code: string },
  ) {
    return await this.productsService.assignCodeToProduct(
      gymId,
      productId,
      body.code,
    );
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
  @Roles(Permissions.GymOwner, Permissions.create_products)
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
  @Roles(Permissions.GymOwner, Permissions.update_products)
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
  @Roles(Permissions.GymOwner, Permissions.delete_products)
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
  @Roles(Permissions.GymOwner, Permissions.update_products)
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
  @Roles(Permissions.GymOwner, Permissions.update_products)
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
  @Get('offers/gym/:gymId')
  @ApiOperation({
    summary: 'Get all product offers for a gym',
    description: 'Retrieve all product offers for a specific gym',
  })
  @ApiOkResponse({
    description: 'Product offers retrieved successfully',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.read_products)
  @ValidateGymRelatedToOwner()
  async getProductsOffers(@Param('gymId') gymId: string) {
    return await this.productsService.getProductsOffers(gymId);
  }

  @Get('offers/:gymId/:id')
  @ApiOperation({
    summary: 'Get product offer by ID',
    description: 'Retrieve a specific product offer by its ID for a gym',
  })
  @ApiOkResponse({
    description: 'Product offer retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product offer not found',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.read_products)
  @ValidateGymRelatedToOwner()
  async getProductsOfferById(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.productsService.getProductsOfferById(id, gymId);
  }

  @Post('offers/create/:gymId')
  @ApiOperation({
    summary: 'Create product offer',
    description: 'Create a new product offer for a gym',
  })
  @ApiCreatedResponse({
    type: SuccessMessageReturn,
    description: 'Product offer created successfully',
  })
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.create_products)
  @ValidateGymRelatedToOwner()
  async createProductsOffer(
    @Param('gymId') gymId: string,
    @User() user: ManagerEntity,
    @Body() createProductsOfferDto: CreateProductsOfferDto,
  ) {
    return await this.productsService.createProductsOffer(
      user,
      createProductsOfferDto,
      gymId,
    );
  }

  @Put('offers/:gymId/:id')
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
  @Roles(Permissions.GymOwner, Permissions.update_products)
  @ValidateGymRelatedToOwner()
  async updateProductsOffer(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
    @User() user: ManagerEntity,
    @Body() updateProductsOfferDto: UpdateProductsOfferDto,
  ) {
    return await this.productsService.updateProductsOffer(
      user,
      id,
      gymId,
      updateProductsOfferDto,
    );
  }

  @Delete('offers/delete/:gymId/:offerId')
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
  @Roles(Permissions.GymOwner, Permissions.delete_products)
  @ValidateGymRelatedToOwner()
  async deleteProductsOffer(
    @Param('offerId') id: string,
    @Param('gymId') gymId: string,
    @User() user: ManagerEntity,
  ) {
    return await this.productsService.deleteProductsOffer(user, id, gymId);
  }

  @Put('show-in-public-page/:gymId/:productId')
  @ApiOperation({
    summary: 'Show product in public page',
    description: 'Show a product in public page',
  })
  @ApiOkResponse({
    type: SuccessMessageReturn,
    description: 'Product shown in public page successfully',
  })
  @ValidateGymRelatedToOwner()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.update_products)
  async showProductInPublicPage(
    @Param('gymId') gymId: string,
    @Param('productId') productId: string,
  ) {
    return await this.productsService.showProductInPublicPage(gymId, productId);
  }
}
