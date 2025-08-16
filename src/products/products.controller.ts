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
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { User } from '../decorators/users.decorator';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { User as UserEntity } from '../user/user.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  UploadFileDto,
} from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { Role } from 'src/decorators/roles/role.enum';
import { Roles } from 'src/decorators/roles/Role';
import { Manager } from 'src/manager/manager.entity';
import { WebpPipe } from 'src/pipes/webp.pipe';
import { imageTypes } from 'src/utils/constants';
import { validateImage } from 'src/utils/helprt-functions';
import { BadRequestException } from 'src/error/bad-request-error';

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

  @Post('create')
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
  @Roles(Role.GymOwner)
  async createProduct(
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
    @User() user: Manager,
    @Body() body: CreateProductDto,
  ) {
    if (!validateImage(file)) {
      throw new BadRequestException('Invalid image type');
    }
    return await this.productsService.createProduct(file, user, body);
  }

  @Put(':id')
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
  @Roles(Role.GymOwner)
  async updateProduct(
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
    return await this.productsService.updateProduct(id, file, user, body);
  }

  @Delete(':id')
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
  @Roles(Role.GymOwner)
  async deleteProduct(@Param('id') id: string, @User() user: UserEntity) {
    return await this.productsService.deleteProduct(id, user);
  }
}
