import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
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
import { Request } from 'express';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { User } from '../decorators/users.decorator';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import {
  CreateProductDto,
  UpdateProductDto,
  UploadFileDto,
} from './dto/create-product.dto';
import { TransferProductDto } from './dto/transfer-product.dto';
import { ReturnProductDto } from './dto/return-product.dto';
import { ProductsService } from './products.service';
import { Permissions } from '../decorators/roles/role.enum';
import { Roles } from '../decorators/roles/Role';
import { WebpPipe } from '../pipes/webp.pipe';
import { imageTypes } from '../utils/constants';
import { validateImage } from '../utils/helprt-functions';
import { BadRequestException } from '../error/bad-request-error';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';
import { isUUID } from 'class-validator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/gym/:gymId')
  @ApiOperation({
    summary: 'Get all products',
    description: 'Retrieve all products with their details',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
  })
  async getProducts(@Param('gymId') gymId: string) {
    return await this.productsService.getProducts(gymId);
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
      transferProductDto.transferedToId,
      transferProductDto.transferQuantity,
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
}
