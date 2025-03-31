import {
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiProperty,
} from '@nestjs/swagger';
import { WebpPipe } from 'src/pipes/webp.pipe';
import { MediaService } from './media.service';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
