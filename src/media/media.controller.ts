import {
  Controller,
  Get,
  Header,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
} from '@nestjs/swagger';
import { WebpPipe } from '../pipes/webp.pipe';
import { MediaService } from './media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '../error/api-responses.decorator';
import { Response } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/users.decorator';
import { User as UserEntity } from '../user/user.model';

class File {
  @ApiProperty({
    format: 'binary',
    type: 'string',
  })
  file: any;
}

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: 'Upload file',
    type: File,
  })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @UploadedFile(
      WebpPipe,
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.mediaService.upload(file, '');
  }

  @Get('get/:id')
  @ApiOperation({
    summary: 'Get Single file',
    description:
      'Send the ID of the file you uploaded previously to get it from the server',
  })
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'inline')
  @ApiOkResponse({
    description: 'File retrieved successfully',
  })
  @ApiInternalServerErrorResponse()
  @ApiNotFoundResponse('Media not found')
  @ApiBadRequestResponse('Bad request error')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const fileStream = await this.mediaService.getFileStreamById(id, res);
    return fileStream.pipe(res);
  }
  @Get('s3-url/:id')
  // @UseGuards(AuthGuard)
  async getS3Url(@Param('id') id: string, @User() _user: UserEntity) {
    return await this.mediaService.getS3Url(id);
    // return await this.mediaService.getS3Url(id, user.id);
  }
}
